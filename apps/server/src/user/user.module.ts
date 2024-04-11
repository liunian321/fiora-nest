import { Module } from '@nestjs/common';
import { UserGateway } from './user.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/database/schemas/user.schema';
import { GroupModule } from '../group/group.module';
import { UserInfo, UserInfoSchema } from '../database/schemas/user-info.schema';
import {
  Notification,
  NotificationSchema,
} from '../database/schemas/notification.schema';
import { Friend, FriendSchema } from '../database/schemas/friend.schema';

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
