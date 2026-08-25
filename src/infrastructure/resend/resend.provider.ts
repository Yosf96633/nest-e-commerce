import { Resend } from 'resend';
import { ConfigService } from '@nestjs/config';

export const RESEND_CLIENT = 'RESEND_CLIENT';

export const ResendProvider = {
  provide: RESEND_CLIENT,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    return new Resend(configService.get<string>('RESEND_API_KEY'));
  },
};
