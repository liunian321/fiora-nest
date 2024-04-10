import { Module } from '@nestjs/common';
import { MongooseProviders } from './mongoose.provider';

@Module({
  imports: [],
  providers: [...MongooseProviders],
  exports: [...MongooseProviders],
})
export class DatabaseModule {}
