import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const JwtRegisterAsyncModule = JwtModule.registerAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    secret: configService.get('JWT_SECRET'),
    signOptions: {
      expiresIn: configService.get('TOKEN_EXPIRES_TIME')
        ? parseInt(configService.get('TOKEN_EXPIRES_TIME'))
        : '30d',
    },
    global: true,
  }),
  inject: [ConfigService],
  global: true,
});
