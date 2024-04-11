import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ConnectionGateway } from './connection.gateway';
import { UserInfo, UserInfoSchema } from '../database/schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserInfo.name, schema: UserInfoSchema },
    ]),
  ],
  providers: [ConnectionGateway],
})
export class GatewayModule {}
