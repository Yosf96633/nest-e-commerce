import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { IProductRepository } from './interfaces/product.repository.interface';
import { DrizzleProductRepository } from '@/infrastructure/database/repositories/product/drizzle-product.repository';
import { StoreModule } from '../store/store.module';
import { CloudinaryModule } from '@/infrastructure/cloudinary/cloudinary.module';
import { ProductImageUploadInterceptor } from './interceptors/product-image-upload.interceptor';

@Module({
  imports: [StoreModule, CloudinaryModule],
  providers: [
    ProductService,
    ProductImageUploadInterceptor,
    {
      provide: IProductRepository,
      useClass: DrizzleProductRepository,
    },
  ],
  controllers: [ProductController],
})
export class ProductModule {}
