import { Type } from 'class-transformer';
import {
  IsOptional,
  IsPhoneNumber,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import type { DeliveryAddress } from '../entities/order.entity';

export class DeliveryAddressDto implements DeliveryAddress {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  recipientName!: string;

  @IsPhoneNumber()
  phoneNumber!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(300)
  addressLine1!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  addressLine2?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  instructions?: string;
}

export class CheckoutDto {
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  deliveryAddress!: DeliveryAddressDto;
}
