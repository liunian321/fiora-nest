import { Module } from '@nestjs/common';
import { MongooseProviders } from './mongoose.provider';

@Module({
  providers: [...MongooseProviders],
  exports: [...MongooseProviders],
})
export class DatabaseModule {}
