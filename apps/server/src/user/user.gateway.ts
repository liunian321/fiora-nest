import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WsException,
} from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../database/schemas/user.schema';
import { Inject, Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { Context } from '../interfaces/socket.interface';
import { Environment } from './interfaces/user.interface';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  getNewRegisteredUserIpKey,
  getNewUserKey,
  randomAvatar,
} from '../constant';
import { GroupProvider } from '../group/group.provider';
import * as bcrypt from 'bcrypt';
import { ONE_DAY } from '../constant/base.constant';
import { isEmpty } from 'lodash';
import { JwtService } from '@nestjs/jwt';
import {
  UserInfo,
  UserInfoDocument,
} from '../database/schemas/user-info.schema';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class UserGateway {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly groupProvider: GroupProvider,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(UserInfo.name)
    private readonly userInfoDocumentModel: Model<UserInfoDocument>,
  ) {}

  logger: Logger = new Logger(UserGateway.name);

  @SubscribeMessage('register')
  @UsePipes(new ValidationPipe({ transform: true }))
  async register(
    @MessageBody()
    ctx: Context<{ username: string; password: string } & Environment>,
  ) {
    if (this.configService.get<boolean>('DISABLE_REGISTER') === true) {
      throw new WsException('注册功能已被禁用, 请联系管理员开通账号');
    }

    const user = await this.userModel.findOne({ username: ctx.data.username });
    if (user) {
      throw new WsException('用户名已存在');
    }

    const registeredCountWithin24Hours = await this.cacheManager.get<
      string | undefined
    >(getNewRegisteredUserIpKey(ctx.socket.ip));

    if (
      registeredCountWithin24Hours &&
      parseInt(registeredCountWithin24Hours) >=
        parseInt(this.configService.get<string>('MAX_IP_REGISTER_COUNT', '5'))
    ) {
      throw new WsException('注册次数过多, 请稍后再试');
    }

    const defaultGroup = await this.groupProvider.getDefaultGroup();
    if (!defaultGroup) {
      throw new WsException('默认群组不存在');
    }

    const saltRounds = parseInt(
      this.configService.get<string>('SALT_ROUNDS', '10'),
    );

    const hashedPassword = await bcrypt.hash(ctx.data.password, saltRounds);

    let newUser = null;
    try {
      newUser = await this.userModel.create({
        username: ctx.data.username,
        salt: saltRounds,
        password: hashedPassword,
        avatar: randomAvatar(),
        lastLoginIp: ctx.socket.ip,
      });
    } catch (err) {
      if ((err as Error).name === 'ValidationError') {
        return '用户名包含不支持的字符或者长度超过限制';
      }
      throw err;
    }

    // 将用户添加到新用户列表
    await this.addUserToNewUserList(newUser, ctx.socket.ip);

    if (!isEmpty(defaultGroup.creator)) {
      defaultGroup.creator = newUser.id;
    }
    defaultGroup.memberIds.push(newUser.id);
    await this.groupProvider.updateGroup(defaultGroup.id, defaultGroup);

    // 颁发 token
    const token = await this.jwtService.signAsync({ userId: newUser.id });
    ctx.socket.user = newUser.id;

    // TODO: 后续这个操作迁移到 User-Info 模块中
    await this.userInfoDocumentModel.create(
      {
        id: ctx.socket.id,
      },
      {
        user: newUser._id,
        os: ctx.data.os,
        browser: ctx.data.browser,
        environment: ctx.data.environment,
      },
    );

    return {
      _id: newUser._id,
      avatar: newUser.avatar,
      username: newUser.username,
      groups: [
        {
          _id: defaultGroup._id,
          name: defaultGroup.name,
          avatar: defaultGroup.avatar,
          creator: defaultGroup.creator,
          createTime: defaultGroup.createTime,
          messages: [],
        },
      ],
      friends: [],
      token,
      isAdmin: false,
      notificationTokens: [],
    };
  }

  /**
   * 将用户添加到新用户列表
   * @param user
   * @param ip
   * @private
   */
  private async addUserToNewUserList(user: UserDocument, ip: string) {
    if (Date.now() - user.createTime.getTime() > ONE_DAY) {
      return;
    }

    await this.cacheManager.set(getNewUserKey(user.id), ip, ONE_DAY);

    if (!isEmpty(ip)) {
      const newRegisteredUserIpKey = getNewRegisteredUserIpKey(ip);
      const registeredCount = await this.cacheManager.get<string>(
        newRegisteredUserIpKey,
      );

      await this.cacheManager.set(
        newRegisteredUserIpKey,
        (parseInt(registeredCount || '0', 10) + 1).toString(),
        ONE_DAY,
      );
    }
  }
}
