import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import ms from 'ms';

import { PROJECT_NAME } from '../base.constant';

export const MongooseForRootAsyncModule = MongooseModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    // MongoDB和其他数据库不一样，不同数据库的账号密码不一样，所以有密码需求的话，需要自行配置！
    // auth: {
    // username: configService.get('MONGODB_USER', 'root'),
    // password: configService.get('MONGODB_PASSWORD', '123456'),
    // },
    uri: configService.get(
      'MONGODB_URI',
      'mongodb://192.168.28.157:27017/fiora-nest',
    ),
    tls: false,
    authSource: PROJECT_NAME,
    minPoolSize: parseInt(configService.get('MONGODB_MIN_POOL_SIZE', '2')),
    maxPoolSize: parseInt(configService.get('MONGODB_MAX_POOL_SIZE', '10')),
    connectTimeoutMS: ms('30s'),
  }),
  inject: [ConfigService],
});
