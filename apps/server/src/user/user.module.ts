import { Module } from '@nestjs/common';
import { UserGateway } from './user.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/database/schemas/user.schema';
import { GroupModule } from '../group/group.module';
import { UserInfo, UserInfoSchema } from '../database/schemas/user-info.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserInfo.name, schema: UserInfoSchema },
    ]),
    GroupModule,
  ],
  providers: [UserGateway],
  exports: [],
})
export class UserModule {}
