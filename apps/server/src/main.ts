import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // const redisIoAdapter = new RedisIoAdapter(app);
  // await redisIoAdapter.connectToRedis(process.env.REDIS_URL);
  // app.useWebSocketAdapter(redisIoAdapter);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          imgSrc: [
            'self',
            'data:',
            'apollo-server-landing-page.cdn.apollographql.com',
          ],
          scriptSrc: ['self', 'https: "unsafe-inline"'],
          manifestSrc: [
            'self',
            'apollo-server-landing-page.cdn.apollographql.com',
          ],
          frameSrc: ['self', 'sandbox.embed.apollographql.com'],
        },
      },
    }),
  );

  await app.listen(+(process.env.PORT ?? 3000));

  console.log(`Application is running on: ${await app.getUrl()}`);
}
void bootstrap();
