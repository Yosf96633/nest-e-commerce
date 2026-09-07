import { Module } from '@nestjs/common';
import { StoreService } from './store.service';
import { StoreController } from './store.controller';
import { IStoreRepository } from './interfaces/store.repository.interface';
import { DrizzleStoreRepository } from '@/infrastructure/database/repositories/store/drizzle-store.repository';
import { CloudinaryModule } from '@/infrastructure/cloudinary/cloudinary.module';
import { StoreImageUploadInterceptor } from './interceptors/store-image-upload.interceptor';

@Module({
  imports: [CloudinaryModule],
  controllers: [StoreController],
  providers: [
    StoreService,
    StoreImageUploadInterceptor,
    {
      provide: IStoreRepository,
      useClass: DrizzleStoreRepository,
    },
  ],
  exports: [StoreService, IStoreRepository],
})
export class StoreModule {}
