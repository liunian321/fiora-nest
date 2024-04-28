import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { MessageGateway } from './message.gateway';
import { MessageProvider } from './message.provider';
import {
  History,
  HistorySchema,
  Message,
  MessageSchema,
  Notification,
  NotificationSchema,
  SocketInfo,
  SocketInfoSchema,
  User,
  UserInfo,
  UserInfoSchema,
  UserSchema,
} from '../database/schemas';
import { GroupModule } from '../group/group.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: User.name, schema: UserSchema },
      { name: UserInfo.name, schema: UserInfoSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: SocketInfo.name, schema: SocketInfoSchema },
      { name: History.name, schema: HistorySchema },
    ]),
    forwardRef(() => GroupModule),
    UserModule,
  ],
  providers: [MessageGateway, MessageProvider],
  exports: [MessageProvider],
})
export class MessageModule {}
