import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { GatewayModule } from './gateways/gateway.module';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './guards/webSocket/roles.guard';

@Module({
  imports: [
    AppModule,
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    GatewayModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
