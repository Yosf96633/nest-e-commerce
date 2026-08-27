import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/modules/users/users.module';
import { HashingUtil } from './utils/hashing.util';
import { ResendModule } from 'src/infrastructure/resend/resend.module';
import { EMAIL_VERIFICATION_TOKEN_REPOSITORY } from './interfaces/email-verification-tokens-repositry.interface';
import { DrizzleEmailVeriRepository } from './repositories/drizzle-email-verification-token.respository';
import { EMAIL_VERIFICATION_TOKEN_URL } from './auth.constants';
import { JwtModule } from '@nestjs/jwt';

import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('NODE_ENV') === 'production' ? '1h' : '2m' },
      })
    }),
    UsersModule, ResendModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    HashingUtil,
    JwtAuthGuard,
    {
      provide: EMAIL_VERIFICATION_TOKEN_REPOSITORY,
      useClass: DrizzleEmailVeriRepository,
    },
    {
      provide: EMAIL_VERIFICATION_TOKEN_URL,
      useFactory: (configService: ConfigService) =>
        configService.get<string>('EMAIL_VERIFICATION_TOKEN_URL') ??
        'http://localhost:3000/verify-email',
      inject: [ConfigService],
    },
  ],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule { }
