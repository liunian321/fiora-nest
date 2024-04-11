import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // const redisIoAdapter = new RedisIoAdapter(app);
  // await redisIoAdapter.connectToRedis(process.env.REDIS_URL);
  // app.useWebSocketAdapter(redisIoAdapter);

  await app.listen(+(process.env.PORT ?? 3000));
  console.log(`Application is running on: ${await app.getUrl()}`);
}
void bootstrap();
