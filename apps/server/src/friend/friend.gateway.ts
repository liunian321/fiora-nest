import assert from 'assert';

import {
  SubscribeMessage,
  WebSocketGateway,
  WsException,
} from '@nestjs/websockets';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';

import {
  Friend,
  FriendDocument,
  User,
  UserDocument,
} from '../database/schemas';
import { Context } from '../interfaces/socket.interface';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class FriendGateway {
  constructor(
    @InjectModel(Friend.name)
    private readonly friendModel: Model<FriendDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  logger: Logger = new Logger(FriendGateway.name);

  /**
   * 添加好友, 单向添加
   */
  @SubscribeMessage('addFriend')
  @UsePipes(new ValidationPipe({ transform: true }))
  async addFriend(ctx: Context<{ userId: string }>) {
    const { userId } = ctx.data;
    if (!Types.ObjectId.isValid(userId)) {
      throw new WsException('无效的用户ID');
    }

    if (ctx.socket.user === userId) {
      throw new WsException('不能添加自己为好友');
    }

    const user: UserDocument = await this.userModel
      .findOne({ _id: userId })
      .exec();
    if (!user) {
      throw new WsException('添加好友失败, 用户不存在');
    }

    const friend: FriendDocument[] = await this.friendModel
      .find({
        from: ctx.socket.user,
        to: user.id,
      })
      .exec();
    if (friend.length !== 0) {
      // 好友关系已经存在
      throw new WsException('你们已经是好友了');
    }

    const newFriend = await this.friendModel.create({
      from: ctx.socket.user,
      to: user.id,
    });

    return {
      _id: user._id,
      username: user.username,
      avatar: user.avatar,
      from: newFriend.from,
      to: newFriend.to,
    };
  }
}
