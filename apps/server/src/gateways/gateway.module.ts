import { Module } from '@nestjs/common';
import { ConnectionGateway } from './connection.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import { UserInfo, UserInfoSchema } from '../database/schemas/user-info.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserInfo.name, schema: UserInfoSchema },
    ]),
  ],
  providers: [ConnectionGateway],
})
export class GatewayModule {}
