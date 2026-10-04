import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  RIDER_VEHICLE_TYPES,
  type RiderVehicleType,
} from '../entities/rider.entity';

export class UpdateRiderProfileDto {
  @IsOptional()
  @IsEnum(RIDER_VEHICLE_TYPES)
  vehicleType?: RiderVehicleType;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  vehicleMake?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  vehicleModel?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  vehicleColor?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  plateNumber?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  licenseNumber?: string | null;
}
