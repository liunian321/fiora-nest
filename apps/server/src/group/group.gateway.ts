import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GroupDocument } from '../database/schemas/group.schema';
import { Roles } from '../decorator/roles.decorator';
import { RolesGuard } from '../guards/webSocket/roles.guard';
import { randomAvatar } from '../constant/functions/avatar.function';
import { Context } from '../interfaces/socket.interface';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class GroupGateway {
  constructor(
    private readonly configService: ConfigService,
    @InjectModel('Group') private readonly groupModel: Model<GroupDocument>,
  ) {}

  @WebSocketServer()
  server: Server;

  logger: Logger = new Logger(GroupGateway.name);

  /**
   * 创建群组
   * @param ctx 当前上下文
   * @param client socket.io 客户端
   */
  @SubscribeMessage('createGroup')
  @Roles(['admin'])
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseGuards(RolesGuard)
  async createGroup(
    @MessageBody() ctx: Context<{ name: string }>,
    @ConnectedSocket() client: Socket,
  ): Promise<string> {
    const { name } = ctx.data;

    const ownGroupCount = await this.groupModel.countDocuments({
      creator: ctx.socket.user,
    });

    if (ownGroupCount >= this.configService.get<number>('MAX_GROUPS')) {
      throw new WsException(
        `创建群组失败, 你已经创建了${this.configService.get<number>('MAX_GROUPS')}个群组`,
      );
    }

    const groupCount = await this.groupModel.countDocuments({ name });
    if (groupCount > 0) {
      throw new WsException('该群组已存在');
    }

    let newGroup = null;
    try {
      newGroup = await this.groupModel.create({
        name,
        avatar: randomAvatar(),
        creator: ctx.socket.user,
        members: [ctx.socket.user],
      });
    } catch (err) {
      if (err.name === 'ValidationError') {
        return '群组名包含不支持的字符或者长度超过限制';
      }
      throw err;
    }

    client.join(newGroup._id.toString());
  }
}
