import { Module } from '@nestjs/common';
import { DrizzleRiderRepository } from '@/infrastructure/database/repositories/rider/drizzle-rider.repository';
import { IRiderRepository } from './interfaces/rider.repository.interface';
import { RiderController } from './rider.controller';
import { RiderService } from './rider.service';

@Module({
  controllers: [RiderController],
  providers: [
    RiderService,
    {
      provide: IRiderRepository,
      useClass: DrizzleRiderRepository,
    },
  ],
})
export class RiderModule {}
