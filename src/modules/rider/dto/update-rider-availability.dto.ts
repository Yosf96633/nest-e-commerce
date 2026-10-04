import { IsBoolean } from 'class-validator';

export class UpdateRiderAvailabilityDto {
  @IsBoolean()
  isAvailable!: boolean;
}
