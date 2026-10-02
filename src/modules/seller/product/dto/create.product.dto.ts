import { Type } from 'class-transformer';
import {
  IsArray,
  ArrayMinSize,
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
import {
  PRODUCT_STATUSES,
  type ProductImage,
  type ProductStatus,
} from '../entities/product.entity';

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
  @IsEnum(PRODUCT_STATUSES)
  status?: ProductStatus;

  // Populated by ProductImageUploadInterceptor after Cloudinary upload.
  @IsArray()
  @ArrayMinSize(1, { message: 'At least 1 image is required' })
  images: ProductImage[];
}
