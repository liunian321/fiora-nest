import { Module } from '@nestjs/common';
import { GroupGateway } from './group.gateway';
import { GroupProvider } from './group.provider';
import { MessageModule } from '../message/message.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Group, GroupSchema } from '../database/schemas/group.schema';

@Module({
  imports: [
    MessageModule,
    MongooseModule.forFeature([{ name: Group.name, schema: GroupSchema }]),
  ],
  providers: [GroupGateway, GroupProvider],
})
export class GroupModule {}
