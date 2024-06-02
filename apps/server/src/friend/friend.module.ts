import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { FriendGateway } from './friend.gateway';
import { Friend, FriendSchema, User, UserSchema } from '../database/schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Friend.name, schema: FriendSchema },
    ]),
  ],
  providers: [FriendGateway],
})
export class FriendModule {}
