import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from '../../decorator/roles.decorator';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get(Roles, context.getHandler());

    // 如果没有设置角色，则默认为所有角色都可以访问
    if (!roles) {
      return true;
    }

    let request;
    if (context.getType() === 'http') {
      request = context.switchToHttp().getRequest();
    } else if (context.getType() === 'ws') {
      request = context.switchToWs().getData().request;
    } else if (context.getType() === 'rpc') {
      request = context.switchToRpc().getData();
    } else {
      // 如果请求是未知类型，则拒绝访问
      return false;
    }

    const user = request.user;
    const adminUsers = this.configService.get<string>('ADMIN_USERS').split(',');

    // 如果接口需要 admin 角色，且用户是 admin 用户，则允许访问
    return roles.includes('admin') && adminUsers.includes(user.username);
  }
}
