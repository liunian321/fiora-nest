import { Module } from '@nestjs/common';
import { UserGateway } from './user.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/database/schemas/user.schema';
import { GroupModule } from '../group/group.module';
import {
  Friend,
  FriendSchema,
  NotificationSchema,
  UserInfo,
  UserInfoSchema,
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
