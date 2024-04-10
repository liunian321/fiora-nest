import { Module } from '@nestjs/common';
import { ConnectionGateway } from './connection.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import { Socket, SocketSchema } from '../database/schemas/socket.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Socket.name, schema: SocketSchema }]),
  ],
  providers: [ConnectionGateway],
})
export class GatewayModule {}
