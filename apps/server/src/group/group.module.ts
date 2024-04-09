import { Module } from '@nestjs/common';
import { GroupGateway } from './group.gateway';
import { GroupProvider } from './group.provider';
import { MessageModule } from '../message/message.module';

@Module({
  imports: [MessageModule],
  providers: [GroupGateway, GroupProvider],
})
export class GroupModule {}
