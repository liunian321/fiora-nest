import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { GatewayModule } from './gateways/gateway.module';
import { GroupModule } from './group/group.module';
import { MessageModule } from './message/message.module';
import { CacheRegisterAsyncModule } from './constant/modules/cache.module';
import { JwtRegisterAsyncModule } from './constant/modules/jwt.module';
import { ThrottlerForRootModule } from './constant/modules/throttler.module';
import { MongooseForRootAsyncModule } from './constant/modules/mongoose.module';
import { UserModule } from './user/user.module';
import { APP_PIPE } from '@nestjs/core';
import { ValidationPipe } from './pipes/validation.pipe';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheRegisterAsyncModule,
    JwtRegisterAsyncModule,
    ThrottlerForRootModule,
    MongooseForRootAsyncModule,
    GatewayModule,
    GroupModule,
    MessageModule,
    UserModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class AppModule {}
