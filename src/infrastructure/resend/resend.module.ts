import { Module } from '@nestjs/common';
import { ResendService } from './resend.service';
import { ResendProvider } from './resend.provider';

@Module({
  providers: [ResendProvider, ResendService],
  exports : [ResendService]
})
export class ResendModule {}
