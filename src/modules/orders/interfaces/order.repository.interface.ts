import type {
  CheckoutResult,
  DeliveryAddress,
  OrderDetails,
  OrderStatus,
} from '../entities/order.entity';

export interface IOrderRepository {
  checkout(
    userId: string,
    deliveryAddress: DeliveryAddress,
    deliveryFee: string,
  ): Promise<CheckoutResult>;
  findByUser(userId: string): Promise<OrderDetails[]>;
  findByIdForUser(
    orderId: string,
    userId: string,
  ): Promise<OrderDetails | undefined>;
  findByIdForRider(
    orderId: string,
    riderUserId: string,
  ): Promise<OrderDetails | undefined>;
  findCurrentByRider(riderUserId: string): Promise<OrderDetails[]>;
  transitionStatus(
    orderId: string,
    riderProfileId: string,
    currentStatus: OrderStatus,
    nextStatus: OrderStatus,
  ): Promise<OrderDetails | undefined>;
  cancelAssigned(
    orderId: string,
    userId: string,
  ): Promise<OrderDetails | undefined>;
}

export const IOrderRepository = Symbol('IOrderRepository');
