import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { WsException } from '@nestjs/websockets';
import { isEmpty } from 'lodash';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';

import { Roles } from '../../decorator/roles.decorator';
import { getSealIpKey, getSealUserKey } from '../../constant';

/**
 * 访问守卫
 */
@Injectable()
export class AccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get(Roles, context.getHandler());

    if (context.getType() === 'http') {
      // should to do something~
    } else if (context.getType() === 'ws') {
      return await this.webSocket(context, roles);
    } else if (context.getType() === 'rpc') {
      // should to do something~
    } else {
      // 如果请求是未知类型，则拒绝访问
      throw new WsException('未知请求类型');
    }

    return true;
  }

  async webSocket(
    context: ExecutionContext,
    roles: string[],
  ): Promise<boolean> {
    const request = context.switchToWs().getData().request;
    let userId: string;
    try {
      userId = request.user;
    } catch (err) {
      throw new WsException('请先登录');
    }
    if (isEmpty(userId)) {
      throw new WsException('请先登录');
    }

    // 如果接口指定了需要 admin 角色
    if (roles && roles.includes('admin')) {
      const adminUsers = this.configService
        .get<string>('ADMIN_USERS')
        .split(',');

      // 如果接口需要 admin 角色，且用户是 admin 用户，则允许访问
      const include = adminUsers.includes(userId);
      if (!include) {
        throw new WsException('无权访问');
      }
    }

    const ip = request.socket.remoteAddress;
    const sealResult = await Promise.all([
      this.cacheManager.get<string>(getSealIpKey(ip)),
      this.cacheManager.get<string>(getSealUserKey(userId)),
    ]);

    if (sealResult && sealResult.length > 0) {
      throw new WsException('您的ip已被封禁');
    }

    return true;
  }
}
