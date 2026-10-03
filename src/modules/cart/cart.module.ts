import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { DrizzleCartRepository } from '@/infrastructure/database/repositories/cart/drizzle-cart.repository';
import { ICartRepository } from './interfaces/cart.repository.interface';

@Module({
  controllers: [CartController],
  providers: [
    CartService,
    {
      provide: ICartRepository,
      useClass: DrizzleCartRepository,
    },
  ],
})
export class CartModule {}
