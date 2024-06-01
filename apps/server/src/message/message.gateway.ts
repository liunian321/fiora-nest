import { AssertionError } from 'assert';

import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WsException,
} from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import {
  Inject,
  Logger,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { clone, isEmpty } from 'lodash';
import { Expo, ExpoPushErrorTicket } from 'expo-server-sdk';

import { WsThrottlerGuard } from '../guards/webSocket';
import { Context } from '../interfaces/socket.interface';
import { SendMessageData } from './interfaces/message.interface';
import {
  DisableNewUserSendMessageKey,
  DisableSendMessageKey,
  EachFetchMessagesCount,
  OneYear,
  RPS,
} from '../constant/base.constant';
import {
  Message,
  MessageDocument,
  Notification,
  NotificationDocument,
  UserInfo,
  UserInfoDocument,
  SocketInfo,
  SocketInfoDocument,
  History,
  HistoryDocument,
} from '../database/schemas';
import { GroupProvider } from '../group/group.provider';
import { UserProvider } from '../user/user.provider';
import { ObjectUtil } from '../utils/object.util';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MessageGateway {
  constructor(
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectModel(UserInfo.name)
    private readonly userInfoDocumentModel: Model<UserInfoDocument>,
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(SocketInfo.name)
    private readonly socketModel: Model<SocketInfoDocument>,
    @InjectModel(History.name)
    private readonly historyModel: Model<HistoryDocument>,
    private readonly groupProvider: GroupProvider,
    private readonly userProvider: UserProvider,
  ) {}

  logger: Logger = new Logger(MessageGateway.name);

  /**
   * 发送消息
   */
  @SubscribeMessage('sendMessage')
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseGuards(WsThrottlerGuard)
  async sendMessage(@MessageBody() ctx: Context<SendMessageData>) {
    const disabled = await this.cacheManager.get(DisableSendMessageKey);
    if (disabled !== 'true' || ctx.socket.isAdmin) {
      throw new WsException('全员禁言中');
    }

    const disableNewUserSendMessage = await this.cacheManager.get(
      DisableNewUserSendMessageKey,
    );

    if (disableNewUserSendMessage === 'true') {
      // 查找创建时间在 1 年内的用户
      const user = await this.userInfoDocumentModel
        .findOne({
          userId: ctx.socket.user,
          createTime: {
            $gt: Date.now() - OneYear,
          },
        })
        .exec();

      if (ctx.socket.isAdmin || !user) {
        throw new WsException('新用户禁言中!');
      }
    }

    const toGroup = await this.groupProvider.findGroupByCondition({
      _id: ctx.data.to,
    });
    if (!toGroup) {
      throw new WsException('群组不存在');
    }

    const userId = ctx.data.to.replace(ctx.socket.user, '');
    const toUser = await this.userProvider.getUserById(userId);
    if (!toUser) {
      throw new WsException('用户不存在');
    }

    let messageContent = clone(ctx.data.content);
    let type = clone(ctx.data.type);

    if (type === 'text') {
      if (messageContent.length <= 2048) {
        throw new WsException('消息长度过长');
      }

      const rollRegex = /^-roll( ([0-9]*))?$/;
      if (rollRegex.test(messageContent)) {
        const regexResult = rollRegex.exec(messageContent);
        if (regexResult) {
          let numberStr = regexResult[1] || '100';
          if (numberStr.length > 5) {
            numberStr = '99999';
          }
          const number = parseInt(numberStr, 10);
          type = 'system';
          messageContent = JSON.stringify({
            command: 'roll',
            value: Math.floor(Math.random() * (number + 1)),
            top: number,
          });
        }
      } else if (/^-rps$/.test(messageContent)) {
        type = 'system';
        messageContent = JSON.stringify({
          command: 'rps',
          value: RPS[Math.floor(Math.random() * RPS.length)],
        });
      }
    } else if (type === 'file') {
      const file: { size: number } = JSON.parse(ctx.data.content);
      const maxFileSize = this.configService.get<number>(
        'MAX_FILE_SIZE',
        1024 * 1024 * 10,
      );

      if (file.size < maxFileSize) {
        throw new WsException('文件大小超过限制');
      }

      messageContent = ctx.data.content;
    } else if (type === 'inviteV2') {
      const shareTargetGroup = await this.groupProvider.findGroupByCondition({
        _id: ctx.data.content,
      });
      if (!shareTargetGroup) {
        throw new AssertionError({ message: '目标群组不存在' });
      }

      const user = await this.userProvider.findOneUserByCondition({
        _id: ctx.socket.user,
      });
      if (!user) {
        throw new AssertionError({ message: '用户不存在' });
      }

      messageContent = JSON.stringify({
        inviter: user._id,
        group: shareTargetGroup._id,
      });
    }

    const user = await this.userProvider.findOneUserByCondition(
      {
        _id: ctx.socket.user,
      },
      {
        username: 1,
        avatar: 1,
        tag: 1,
      },
    );

    if (!user) {
      throw new WsException('用户不存在');
    }

    const message = await this.messageModel.create({
      from: ctx.socket.user,
      to: ctx.data.to,
      type,
      content: messageContent,
    });

    const messageData = {
      _id: message._id,
      createTime: message.createTime,
      from: user.toObject(),
      to: ctx.data.to,
      type,
      content: message.content,
    };

    if (ctx.data.type === 'inviteV2') {
      await this.handleInviteV2Message(ctx.data);
    }

    if (toGroup) {
      ctx.socket.emit(toGroup.id, 'message', messageData);

      const notifications = await this.notificationModel
        .find({
          userId: {
            $in: toGroup.memberIds,
          },
        })
        .exec();

      const notificationTokens: string[] = [];
      for (const notification of notifications) {
        if (notification.userId !== ctx.socket.user) {
          notificationTokens.push(notification.token);
        }
      }

      if (notificationTokens.length > 0) {
        await this.pushNotification(
          notificationTokens,
          messageData as unknown as MessageDocument,
          toGroup.name,
        );
      }
    }

    if (!toGroup) {
      const targetSockets = await this.socketModel.find({ user: toUser?._id });
      const targetSocketIdList =
        targetSockets?.map((socket) => socket.id) || [];
      if (targetSocketIdList.length) {
        ctx.socket.emit(targetSocketIdList, 'message', messageData);
      }

      const selfSockets = await this.socketModel.find({
        user: ctx.socket.user,
      });
      const selfSocketIdList = selfSockets?.map((socket) => socket.id) || [];
      if (selfSocketIdList.length) {
        ctx.socket.emit(selfSocketIdList, 'message', messageData);
      }

      const notificationTokens = await this.notificationModel.find({
        user: toUser,
      });
      if (notificationTokens.length) {
        await this.pushNotification(
          notificationTokens.map(({ token }) => token),
          messageData as unknown as MessageDocument,
        );
      }
    }

    const history = await this.historyModel.findOne({
      user: userId,
      linkman: ctx.data.to,
    });
    if (history) {
      history.message = message.id;
      await history.save();
    } else {
      await this.historyModel.create({
        user: userId,
        linkman: ctx.data.to,
        message: message.id,
      });
    }

    return messageData;
  }

  /**
   * 处理邀请消息
   * @param message
   */
  private async handleInviteV2Message(message: SendMessageData) {
    if (message.type === 'inviteV2') {
      const inviteInfo = JSON.parse(message.content);
      if (
        Object.hasOwn(inviteInfo, 'inviteInfo') &&
        Object.hasOwn(inviteInfo, 'group')
      ) {
        const [user, group] = await Promise.all([
          this.userProvider.findOneUserByCondition({
            _id: inviteInfo!.inviter,
          }),
          this.groupProvider.findGroupByCondition({
            _id: inviteInfo!.group,
          }),
        ]);

        if (user && group) {
          message.content = JSON.stringify({
            inviter: inviteInfo.inviter,
            inviterName: user?.username,
            group: inviteInfo.group,
            groupName: group.name,
          });
        }
      }
    }
  }

  private async handleInviteV2Messages(
    messages: Message[],
  ): Promise<Message[]> {
    const inviters: string[] = [];
    const groups: string[] = [];

    messages.map((message) => {
      if (message.type !== 'inviteV2') {
        return false;
      }

      const inviteInfo = JSON.parse(message.content);
      if (
        Object.hasOwn(inviteInfo, 'inviter') &&
        Object.hasOwn(inviteInfo, 'group')
      ) {
        inviters.push(inviteInfo.inviter);
        groups.push(inviteInfo.group);
        return true;
      }

      return false;
    });

    const users = await this.userProvider.findUsersByCondition({
      filter: {
        _id: {
          $in: inviters,
        },
      },
    });

    const groupList = await this.groupProvider.findGroupsByCondition({
      _id: {
        $in: groups,
      },
      memberIds: {
        $in: inviters,
      },
    });

    const userMap = ObjectUtil.listToMap(users, '_id');
    const groupMap = ObjectUtil.listToMap(groupList, '_id');
    for (const message of messages) {
      const inviteInfo = JSON.parse(message.content);
      if (!inviteInfo) {
        continue;
      }

      const user = userMap.get(inviteInfo.inviter);
      const group = groupMap.get(inviteInfo.group);
      if (user && group) {
        Object.assign(inviteInfo, {
          inviterName: user.username,
          groupName: group.name,
        });

        message.content = JSON.stringify(inviteInfo);
      }
    }

    return messages;
  }

  /**
   * 获取联系人的历史消息
   * @param ctx Context
   */
  @SubscribeMessage('getLinkmanHistoryMessages')
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseGuards(WsThrottlerGuard)
  async getLinkmanHistoryMessages(
    @MessageBody() ctx: Context<{ linkmanId: string; existCount: number }>,
  ) {
    const { linkmanId, existCount } = ctx.data;

    const messages = await this.messageModel
      .find(
        { to: linkmanId },
        {
          type: 1,
          content: 1,
          from: 1,
          createTime: 1,
          deleted: 1,
        },
        {
          sort: { createTime: -1 },
          limit: EachFetchMessagesCount + existCount,
        },
      )
      .populate('from', { username: 1, avatar: 1, tag: 1 });
    await this.handleInviteV2Messages(messages);
    const result = messages.slice(existCount).reverse();
    return result;
  }

  /**
   * 获取一组联系人的最后历史消息
   */
  @SubscribeMessage('getLinkmansLastMessages')
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseGuards(WsThrottlerGuard)
  async getLinkmansLastMessages(
    @MessageBody() ctx: Context<{ linkmans: string[] }>,
  ) {
    if (isEmpty(ctx.data.linkmans)) {
      throw new WsException('联系人不能为空');
    }

    const linkmanMessages: {
      [linkmanId: string]: Message[];
    } = {};

    for (const linkman of ctx.data.linkmans) {
      const messages = await this.messageModel
        .find(
          {
            to: linkman,
          },
          {
            type: 1,
            content: 1,
            from: 1,
            createTime: 1,
            deleted: 1,
          },
          {
            sort: { createTime: -1 },
            limit: parseInt(
              this.configService.get('HISTORY_MESSAGE_COUNT'),
              10,
            ),
          },
        )
        .exec();

      linkmanMessages[linkman] = await this.handleInviteV2Messages(messages);
    }

    return linkmanMessages;
  }

  /**
   * 推送通知
   */
  async pushNotification(
    notificationTokens: string[],
    message: MessageDocument,
    groupName?: string,
  ) {
    const expo = new Expo({});

    const content =
      message.type === 'text' ? message.content : `[${message.type}]`;
    const pushMessages = notificationTokens.map((notificationToken) => ({
      to: notificationToken,
      sound: 'default',
      title: groupName || (message.from as any).username,
      body: groupName
        ? `${(message.from as any).username}: ${content}`
        : content,
      data: { focus: message.to },
    }));

    const chunks = expo.chunkPushNotifications(pushMessages as any);
    for (const chunk of chunks) {
      try {
        const results = await expo.sendPushNotificationsAsync(chunk);
        results.forEach((result) => {
          const { status, message: errMessage } = result as ExpoPushErrorTicket;
          if (status === 'error') {
            this.logger.warn('[Notification]', errMessage);
          }
        });
      } catch (error) {
        this.logger.error('[Notification]', (error as Error).message);
      }
    }
  }
}
