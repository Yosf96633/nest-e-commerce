import { Module } from '@nestjs/common';
import { DrizzleOrderRepository } from '@/infrastructure/database/repositories/order/drizzle-order.repository';
import { IOrderRepository } from './interfaces/order.repository.interface';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  controllers: [OrdersController],
  providers: [
    OrdersService,
    {
      provide: IOrderRepository,
      useClass: DrizzleOrderRepository,
    },
  ],
})
export class OrdersModule {}
