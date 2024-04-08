import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { getSocketIp } from '../constant/functions/socket-ip.function';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { SocketDocument } from '../database/schemas/socket.schema';
import { Model } from 'mongoose';

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
    @InjectModel('Socket') private readonly socketModel: Model<SocketDocument>,
  ) {}

  async handleDisconnect(client: Socket) {
    this.logger.log(`客户端 ${getSocketIp(client)} 断开连接`);
    await this.socketModel.deleteOne({ socketId: client.id });
  }

  async handleConnection(client: Socket) {
    const ip = getSocketIp(client);
    this.logger.log(`客户端 ${ip} 连接成功`);

    await this.socketModel.create({
      ip,
      socketId: client.id,
    });
  }
}
