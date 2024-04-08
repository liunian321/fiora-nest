import { Module } from '@nestjs/common';
import { GroupGateway } from './group.gateway';

@Module({
  imports: [],
  providers: [GroupGateway],
})
export class AppModule {}
