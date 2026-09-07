import { Module } from '@nestjs/common';
import { SellerService } from './seller.service';
import { SellerController } from './seller.controller';
import { StoreModule } from './store/store.module';
import { ProductModule } from './product/product.module';

@Module({
  providers: [SellerService],
  controllers: [SellerController],
  imports: [StoreModule, ProductModule]
})
export class SellerModule {}
