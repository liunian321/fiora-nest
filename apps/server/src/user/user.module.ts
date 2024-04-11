import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { UserGateway } from './user.gateway';
import { GroupModule } from '../group/group.module';
import {
  Friend,
  FriendSchema,
  Notification,
  NotificationSchema,
  User,
  UserInfo,
  UserInfoSchema,
  UserSchema,
} from '../database/schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserInfo.name, schema: UserInfoSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Friend.name, schema: FriendSchema },
    ]),
    GroupModule,
  ],
  providers: [UserGateway],
  exports: [],
})
export class UserModule {}
