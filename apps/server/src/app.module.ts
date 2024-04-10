import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { GatewayModule } from './gateways/gateway.module';
import { APP_GUARD } from '@nestjs/core';
import { AccessGuard } from './guards/webSocket/access.guard';
import { GroupModule } from './group/group.module';
import { MessageModule } from './message/message.module';
import { CacheRegisterAsyncModule } from './constant/modules/cache.module';
import { JwtRegisterAsyncModule } from './constant/modules/jwt.module';
import { ThrottlerForRootModule } from './constant/modules/throttler.module';
import { MongooseForRootAsyncModule } from './constant/modules/mongoose.module';
import { UserModule } from './user/user.module';
import { AuthGuard } from './guards/webSocket/auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheRegisterAsyncModule,
    JwtRegisterAsyncModule,
    ThrottlerForRootModule,
    MongooseForRootAsyncModule,
    DatabaseModule,
    GatewayModule,
    GroupModule,
    MessageModule,
    UserModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AccessGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
