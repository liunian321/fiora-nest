import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WsException,
} from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument } from '../database/schemas/user.schema';
import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { Context } from '../interfaces/socket.interface';
import { Environment } from './interfaces/user.interface';
import { Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class UserGateway {
  constructor(
    private readonly configService: ConfigService,
    @InjectModel('User') private readonly userModel: Model<UserDocument>,
  ) {}

  logger: Logger = new Logger(UserGateway.name);

  @SubscribeMessage('register')
  @UsePipes(new ValidationPipe({ transform: true }))
  async register(
    @MessageBody()
    ctx: Context<{ username: string; password: string } & Environment>,
    @ConnectedSocket() client: Socket,
  ) {
    if (this.configService.get<boolean>('DISABLE_REGISTER') === true) {
      throw new WsException('注册功能已被禁用, 请联系管理员开通账号');
    }

    const user = await this.userModel.findOne({ username: ctx.data.username });
    if (user) {
      throw new WsException('用户名已存在');
    }
  }
}
