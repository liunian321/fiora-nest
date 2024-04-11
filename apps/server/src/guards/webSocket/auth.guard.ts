import { IncomingHttpHeaders } from 'http';

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { WsException } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const socket: Socket = context.switchToWs().getClient();
    const headers = socket.handshake.headers;
    const token = this.extractTokenFromHeader(headers);

    if (!token) {
      throw new WsException('请先登录');
    }

    const secret = this.configService.get('TOKEN_SECRET');
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret,
      });
      socket.data.user = payload.userId;
    } catch {
      throw new WsException('登录已过期，请重新登录');
    }

    return true;
  }

  private extractTokenFromHeader(
    headers: IncomingHttpHeaders,
  ): string | undefined {
    const [type, token] = headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
