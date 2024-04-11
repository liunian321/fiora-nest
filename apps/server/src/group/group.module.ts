import { Module } from '@nestjs/common';
import { GroupGateway } from './group.gateway';
import { GroupProvider } from './group.provider';
import { MessageModule } from '../message/message.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Group, GroupSchema, User, UserSchema } from '../database/schemas';
import { WebSocketGuardModule } from '../guards/web-socket-guard.module';

@Module({
  imports: [
    MessageModule,
    MongooseModule.forFeature([
      { name: Group.name, schema: GroupSchema },
      { name: User.name, schema: UserSchema },
    ]),
    WebSocketGuardModule,
  ],
  providers: [GroupGateway, GroupProvider],
  exports: [GroupProvider],
})
export class GroupModule {}
