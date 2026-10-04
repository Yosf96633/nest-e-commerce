import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { CheckoutDto } from './dto/checkout.dto';
import type { RiderOrderStatusUpdate } from './dto/update-order-status.dto';
import type { OrderDetails, OrderStatus } from './entities/order.entity';
import { IOrderRepository } from './interfaces/order.repository.interface';

const DELIVERY_FEE = '5.00';

@Injectable()
export class OrdersService {
  constructor(
    @Inject(IOrderRepository)
    private readonly orderRepository: IOrderRepository,
  ) {}

  async checkout(userId: string, dto: CheckoutDto): Promise<OrderDetails> {
    const result = await this.orderRepository.checkout(
      userId,
      dto.deliveryAddress,
      DELIVERY_FEE,
    );

    if (result.order) return result.order;
    if (result.failure === 'NO_AVAILABLE_RIDER') {
      throw new ServiceUnavailableException(
        'No rider is currently available',
        'NO_AVAILABLE_RIDER',
      );
    }
    const messages = {
      EMPTY_CART: 'Cart is empty',
      PRODUCT_UNAVAILABLE: 'A cart product is no longer available',
      INSUFFICIENT_STOCK: 'A cart quantity exceeds available stock',
    } as const;
    throw new BadRequestException(messages[result.failure], result.failure);
  }

  listForUser(userId: string): Promise<OrderDetails[]> {
    return this.orderRepository.findByUser(userId);
  }

  async getForUser(orderId: string, userId: string): Promise<OrderDetails> {
    const order = await this.orderRepository.findByIdForUser(orderId, userId);
    if (!order) {
      throw new NotFoundException('Order not found', 'ORDER_NOT_FOUND');
    }
    return order;
  }

  listForRider(riderUserId: string): Promise<OrderDetails[]> {
    return this.orderRepository.findCurrentByRider(riderUserId);
  }

  async updateRiderStatus(
    orderId: string,
    riderUserId: string,
    nextStatus: RiderOrderStatusUpdate,
  ): Promise<OrderDetails> {
    const order = await this.orderRepository.findByIdForRider(
      orderId,
      riderUserId,
    );
    if (!order || !order.riderProfileId) {
      throw new NotFoundException(
        'Assigned order not found',
        'ORDER_NOT_FOUND',
      );
    }

    const expectedStatus: Record<RiderOrderStatusUpdate, OrderStatus> = {
      picked_up: 'assigned',
      delivered: 'picked_up',
    };
    if (order.status !== expectedStatus[nextStatus]) {
      throw new ConflictException(
        `Order cannot move from ${order.status} to ${nextStatus}`,
        'INVALID_ORDER_STATUS_TRANSITION',
      );
    }

    const updated = await this.orderRepository.transitionStatus(
      order.id,
      order.riderProfileId,
      order.status,
      nextStatus,
    );
    if (!updated) {
      throw new ConflictException(
        'Order status changed; refresh and try again',
        'ORDER_STATUS_CONFLICT',
      );
    }
    return updated;
  }

  async cancel(orderId: string, userId: string): Promise<OrderDetails> {
    const order = await this.getForUser(orderId, userId);
    if (order.status !== 'assigned') {
      throw new ConflictException(
        'Only an assigned order can be cancelled',
        'ORDER_CANNOT_BE_CANCELLED',
      );
    }

    const cancelled = await this.orderRepository.cancelAssigned(
      orderId,
      userId,
    );
    if (!cancelled) {
      throw new ConflictException(
        'Order status changed; refresh and try again',
        'ORDER_STATUS_CONFLICT',
      );
    }
    return cancelled;
  }
}
