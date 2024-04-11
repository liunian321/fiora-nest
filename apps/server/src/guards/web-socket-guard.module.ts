import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AccessGuard, AuthGuard, WsThrottlerGuard } from './webSocket';
import { User, UserSchema } from '../database/schemas';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [AccessGuard, AuthGuard, WsThrottlerGuard],
})
export class WebSocketGuardModule {}
