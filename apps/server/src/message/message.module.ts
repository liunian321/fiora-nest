import { Module } from '@nestjs/common';
import { MessageGateway } from './message.gateway';
import { MessageProvider } from './message.provider';

@Module({
  providers: [MessageGateway, MessageProvider],
  exports: [MessageProvider],
})
export class MessageModule {}
