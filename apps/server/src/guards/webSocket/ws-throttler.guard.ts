import { ExecutionContext, Injectable } from '@nestjs/common';
import {
  ThrottlerException,
  ThrottlerGuard,
  ThrottlerModuleOptions,
  ThrottlerOptions,
  ThrottlerStorage,
} from '@nestjs/throttler';
import { Socket } from 'socket.io';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument } from '../../database/schemas/user.schema';
import { isEmpty } from 'lodash';
import { ConfigService } from '@nestjs/config';

/**
 * 限流守卫
 * 由于限流的是 webSocket 所以无法设置为全局限流
 */
@Injectable()
export class WsThrottlerGuard extends ThrottlerGuard {
  constructor(
    options: ThrottlerModuleOptions,
    storageService: ThrottlerStorage,
    reflector: Reflector,
    private readonly configService: ConfigService,
    @InjectModel('User') private readonly userModel: Model<UserDocument>,
  ) {
    super(options, storageService, reflector);
  }

  /**
   *  基于ip进行限流
   * @param context
   * @param limit
   * @param ttl
   * @param throttler
   */
  async handleRequest(
    context: ExecutionContext,
    limit: number,
    ttl: number,
    throttler: ThrottlerOptions,
  ): Promise<boolean> {
    const client = context.switchToWs().getClient<Socket>();
    const ip = client.request.socket.remoteAddress;
    const key = this.generateKey(context, ip, throttler.name);
    const { totalHits } = await this.storageService.increment(key, ttl);

    const userId: string = client.data.user;
    const user = await this.userModel.findOne({ _id: userId });
    if (isEmpty(user)) {
      throw new ThrottlerException('用户不存在！');
    }

    const isNewUser =
      user.createTime.getTime() > Date.now() - 1000 * 60 * 60 * 24;
    // 新用户触发禁言消息数
    const newUserLimit =
      parseInt(this.configService.get<string>('NEW_USER_MESSAGE_COUNT', '5')) ??
      5;
    // 老用户触发禁言消息数
    const oldUserLimit =
      parseInt(
        this.configService.get<string>('OLD_USER_MESSAGE_COUNT', '20'),
      ) ?? 20;

    // 如果触发了限流, 则抛出异常
    if (isNewUser && totalHits > newUserLimit) {
      throw new ThrottlerException(
        '发消息过于频繁，你还处于24小时萌新期。请不要恶意刷屏，先冷静一会再试~',
      );
    } else if (totalHits > oldUserLimit) {
      throw new ThrottlerException('发消息过于频繁，请冷静一会再试~');
    }

    return true;
  }
}
