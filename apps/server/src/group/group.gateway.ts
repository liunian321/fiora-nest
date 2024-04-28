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
  async joinGroup(@MessageBody() ctx: Context<{ groupId: string }>) {
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
  async leaveGroup(@MessageBody() ctx: Context<{ groupId: string }>) {
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
  async getGroupOnlineMembers(
    @MessageBody() input: { data: { groupId: string } },
    @ConnectedSocket() client: Socket,
  ) {
    // 从 socket.io 中获取在线成员
    const onlineMembers = this.server.sockets.adapter.rooms.get(
      input.data.groupId,
    );

    if (!onlineMembers) {
      return [];
    }

    // 从在线成员中排除自己
    onlineMembers.delete(client.id);

    return Array.from(onlineMembers);
  }

  /**
   * 获取默认群组的在线成员
   */
  @SubscribeMessage('getDefaultGroupOnlineMembers')
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseGuards(AccessGuard, WsThrottlerGuard)
  async getDefaultGroupOnlineMembers(@ConnectedSocket() client: Socket) {
    const group = await this.groupModel.findOne({ isDefault: true }).exec();
    if (!group) {
      throw new WsException('群组不存在');
    }

    return this.getGroupOnlineMembers({ data: { groupId: group.id } }, client);
  }

  /**
   * 修改群组信息
   */
  @SubscribeMessage('changeGroupInfo')
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseGuards(AccessGuard, WsThrottlerGuard)
  async changeGroupInfo(
    @MessageBody()
    ctx: Context<{ groupId: string; name?: string; avatar?: string }>,
    @ConnectedSocket() client: Socket,
  ) {
    const group = await this.groupModel
      .findOne({ _id: ctx.data.groupId })
      .exec();
    if (!group) {
      throw new WsException('群组不存在');
    }

    if (group.creator.toString() !== ctx.socket.user.toString()) {
      throw new WsException('只有群主才能修改群信息');
    }

    const updateData: Partial<Group> = {};
    if (ctx.data.name) {
      updateData.name = ctx.data.name;
    }
    if (ctx.data.avatar) {
      updateData.avatar = ctx.data.avatar;
    }

    const updateResult = await this.groupModel
      .updateOne({ _id: ctx.data.groupId }, updateData)
      .exec();

    // 没有修改成功
    if (updateResult.modifiedCount === 0) {
      throw new WsException('修改群组名称失败');
    }

    return {};
  }

  /**
   * 删除群组
   */
  @SubscribeMessage('deleteGroup')
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseGuards(AccessGuard, WsThrottlerGuard)
  async deleteGroup(
    @MessageBody() ctx: Context<{ groupId: string }>,
    @ConnectedSocket() client: Socket,
  ) {
    const { groupId } = ctx.data;

    const group = await this.groupModel
      .findOne({
        _id: groupId,
        isDefault: false,
        creator: {
          $eq: ctx.socket.user,
        },
      })
      .exec();

    // 如果删除的是默认的群组并且不是管理员
    if (!group) {
      throw new WsException('您无法删除该群组');
    }

    await this.groupModel.deleteOne({ _id: groupId }).exec();

    client.to(groupId).emit('deleteGroup', { groupId });

    return {};
  }

  /**
   * 获取群组基本信息
   */
  @SubscribeMessage('getGroupBasicInfo')
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseGuards(AccessGuard, WsThrottlerGuard)
  async getGroupBasicInfo(@MessageBody() ctx: Context<{ groupId: string }>) {
    const group = await this.groupModel
      .findOne({ _id: ctx.data.groupId })
      .exec();
    if (!group) {
      throw new WsException('群组不存在');
    }

    return {
      _id: ctx.data.groupId,
      name: group.name,
      avatar: group.avatar,
      createTime: group.createTime,
      creator: group.creator,
      hasMemberCount: group.memberIds.length,
    };
  }
}
