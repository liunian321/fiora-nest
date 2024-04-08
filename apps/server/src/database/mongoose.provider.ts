import * as mongoose from 'mongoose';
import { Connection } from 'mongoose';
import { ConfigService } from '@nestjs/config';

export const MongooseProviders = [
  {
    provide: 'DATABASE_CONNECTION',
    inject: [ConfigService],
    useFactory: async (config: ConfigService) => {
      await mongoose.connect(
        config.get('MONGODB_URI', 'mongodb://localhost:27017/nest'),
        {
          user: config.get('MONGODB_USER', 'root'),
          pass: config.get('MONGODB_PASSWORD', ''),
        },
      );
    },
  },
  {
    provide: 'GROUP_MODEL',
    useFactory: (connection: Connection) => connection.model('Group'),
    inject: ['DATABASE_CONNECTION'],
  },
];
