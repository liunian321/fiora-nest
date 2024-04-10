import { ThrottlerModule } from '@nestjs/throttler';

export const ThrottlerForRootModule = ThrottlerModule.forRoot([
  {
    ttl: 60000,
    limit: 5,
  },
]);
