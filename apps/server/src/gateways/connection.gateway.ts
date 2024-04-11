import assert from 'assert';

import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { UserInfo, UserInfoDocument } from '../database/schemas';
import { getSocketIp } from '../constant';
import * as groupRoutes from '../group/group.gateway';
import { Context } from '../interfaces/socket.interface';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ConnectionGateway
  implements OnGatewayConnection<Socket>, OnGatewayDisconnect<Socket>
{
  logger: Logger = new Logger(ConnectionGateway.name);

  constructor(
    @InjectModel(UserInfo.name)
    private readonly userInfoDocumentModel: Model<UserInfoDocument>,
  ) {}

  async handleDisconnect(client: Socket) {
    this.logger.log(`客户端 ${getSocketIp(client)} 断开连接`);
    await this.userInfoDocumentModel.deleteOne({ socketId: client.id });
  }

  async handleConnection(client: Socket) {
    const ip = getSocketIp(client);
    this.logger.log(`客户端 ${ip} 连接成功`);

    await this.userInfoDocumentModel.create({
      ip,
      socketId: client.id,
    });

    // 暂时没有用上 next
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    client.use(async ([event, data, cb], next) => {
      const routes = {
        ...groupRoutes,
      };
      const route = routes[event];

      if (typeof cb !== 'function') {
        cb = () => {
          this.logger.error('Server Error: emit event with callback');
        };
      }

      if (route) {
        try {
          const ctx: Context<any> = {
            data,
            socket: {
              id: client.id,
              ip: getSocketIp(client),
              get user() {
                return client.data.user;
              },
              set user(newUserId: string) {
                client.data.user = newUserId;
              },
              get isAdmin() {
                return client.data.isAdmin;
              },
              join: client.join.bind(client),
              leave: client.leave.bind(client),
              emit: (target, _event, _data) => {
                client.to(target).emit(_event, _data);
              },
            },
          };

          const before = Date.now();
          const res = await route(ctx);
          const after = Date.now();

          this.logger.log(
            `[${event}]`,
            after - before,
            ctx.socket.id,
            ctx.socket.user || 'null',
            typeof res === 'string' ? res : 'null',
          );

          cb(res);
        } catch (err) {
          if (err instanceof assert.AssertionError) {
            cb(err.message);
          } else {
            this.logger.error(`[${event}]`, err.message);
            cb(`Server Error: ${err.message}`);
          }
        }
      } else {
        cb(`Server Error: event [${event}] not exists`);
      }
    });
  }
}
