import { Module } from '@nestjs/common';
import { MessageGateway } from './message.gateway';
import { MessageProvider } from './message.provider';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from '../database/schemas/message.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
  ],
  providers: [MessageGateway, MessageProvider],
  exports: [MessageProvider],
})
export class MessageModule {}
