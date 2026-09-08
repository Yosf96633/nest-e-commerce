import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import type { ProductImage, ProductStatus } from '@/infrastructure/database/schema';

export class CreateProductDto {
  @IsUUID()
  storeId: string;

  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsEnum(['draft', 'active', 'inactive'])
  status?: ProductStatus;

  // Populated by ProductImageUploadInterceptor after Cloudinary upload.
  @IsOptional()
  @IsArray()
  images?: ProductImage[];
}
