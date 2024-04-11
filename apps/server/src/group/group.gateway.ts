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

import { Group, Message } from '../database/schemas';
import { MessageProvider } from '../message/message.provider';
import { Roles } from '../decorator/roles.decorator';
import { AccessGuard, WsThrottlerGuard } from '../guards/webSocket';
import { Context } from '../interfaces/socket.interface';
import { randomAvatar } from '../constant';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class GroupGateway {
  constructor(
    private readonly configService: ConfigService,
    @InjectModel(Group.name) private readonly groupModel: Model<Group>,
    private readonly messageProvider: MessageProvider,
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
  @UseGuards(AccessGuard, WsThrottlerGuard)
  async createGroup(
    @MessageBody() ctx: Context<{ name: string }>,
    @ConnectedSocket() client: Socket,
  ): Promise<string> {
    const { name } = ctx.data;

    const ownGroupCount = await this.groupModel
      .countDocuments({
        creator: ctx.socket.user,
      })
      .exec();

    if (ownGroupCount >= this.configService.get<number>('MAX_GROUPS')) {
      throw new WsException(
        `创建群组失败, 你已经创建了${this.configService.get<number>('MAX_GROUPS')}个群组`,
      );
    }

    const groupCount = await this.groupModel.countDocuments({ name }).exec();
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

  /**
   * 加入群组
   * @param ctx 当前上下文
   */
  @SubscribeMessage('joinGroup')
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseGuards(AccessGuard, WsThrottlerGuard)
  async joinGroup(ctx: Context<{ groupId: string }>) {
    const group: Group = await this.groupModel
      .findOne({ _id: ctx.data.groupId })
      .exec();

    if (!group) {
      throw new WsException('群组不存在~');
    }

    if (group.memberIds.includes(ctx.socket.user)) {
      throw new WsException('你已经在群组中');
    }

    group.memberIds.push(ctx.socket.user);
    await this.groupModel.updateOne({ _id: ctx.data.groupId }, group).exec();

    const messageModel = await this.messageProvider.getMessageModel();
    const messages: Array<Message> = await messageModel
      .find(
        { toGroup: ctx.data.groupId },
        {
          type: 1,
          content: 1,
          from: 1,
          createTime: 1,
        },
        { sort: { createTime: -1 }, limit: 3 },
      )
      .exec();

    await messageModel.populate(messages, { path: 'from', select: 'username' });
    messages.reverse();

    ctx.socket.join(ctx.data.groupId);

    return {
      _id: ctx.data.groupId,
      name: group.name,
      avatar: group.avatar,
      createTime: group.createTime,
      creator: group.creator,
      messages,
    };
  }

  /**
   * 退出群组
   * @param ctx
   */
  @SubscribeMessage('leaveGroup')
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseGuards(AccessGuard, WsThrottlerGuard)
  async leaveGroup(ctx: Context<{ groupId: string }>) {
    const group: Group = await this.groupModel
      .findOne({ _id: ctx.data.groupId })
      .exec();

    if (!group) {
      throw new WsException('群组不存在~');
    }

    if (!group.memberIds.includes(ctx.socket.user)) {
      throw new WsException('你不在群组中~');
    }

    if (group.creator === ctx.socket.user) {
      throw new WsException('群主不可以退出自己创建的群~');
    }

    const memberSet = new Set(group.memberIds);

    // 不存在要退出的群组
    if (!memberSet.has(ctx.socket.user)) {
      throw new WsException('你不在该群组中~');
    } else {
      memberSet.delete(ctx.socket.user);
    }

    group.memberIds = Array.from(memberSet);
    await this.groupModel.updateOne({ _id: ctx.data.groupId }, group).exec();

    ctx.socket.leave(ctx.data.groupId);

    return {};
  }

  /**
   * 获取群组在线成员
   */
  @SubscribeMessage('getGroupOnlineMembers')
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseGuards(AccessGuard, WsThrottlerGuard)
  async getGroupOnlineMembers(ctx: Context<{ groupId: string }>) {
    const clients = this.server.sockets.adapter.rooms.get(ctx.data.groupId);
    if (!clients) {
      return [];
    }

    return Array.from(clients);
  }
}
