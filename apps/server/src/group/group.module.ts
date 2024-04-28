import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { GroupGateway } from './group.gateway';
import { GroupProvider } from './group.provider';
import { MessageModule } from '../message/message.module';
import { Group, GroupSchema, User, UserSchema } from '../database/schemas';

@Module({
  imports: [
    forwardRef(() => MessageModule),
    MongooseModule.forFeature([
      { name: Group.name, schema: GroupSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [GroupGateway, GroupProvider],
  exports: [GroupProvider],
})
export class GroupModule {}
