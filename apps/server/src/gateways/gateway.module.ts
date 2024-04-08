import { Module } from '@nestjs/common';
import { ConnectionGateway } from './connection.gateway';

@Module({
  providers: [ConnectionGateway],
})
export class GatewayModule {}
