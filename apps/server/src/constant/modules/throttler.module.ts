import { ThrottlerModule } from '@nestjs/throttler';
import ms from 'ms';

export const ThrottlerForRootModule = ThrottlerModule.forRoot([
  {
    ttl: ms('1s'),
    limit: 5,
  },
]);
