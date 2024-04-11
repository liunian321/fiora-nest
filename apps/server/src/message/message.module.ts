import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { MessageGateway } from './message.gateway';
import { MessageProvider } from './message.provider';
import { Message, MessageSchema } from '../database/schemas';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
  ],
  providers: [MessageGateway, MessageProvider],
  exports: [MessageProvider],
})
export class MessageModule {}
