import {
  BadRequestException,
  ConflictException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { OrderDetails } from './entities/order.entity';
import type { IOrderRepository } from './interfaces/order.repository.interface';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  let repository: jest.Mocked<IOrderRepository>;
  let service: OrdersService;

  const order: OrderDetails = {
    id: 'order-id',
    userId: 'user-id',
    riderProfileId: 'rider-profile-id',
    status: 'assigned',
    deliveryAddress: {
      recipientName: 'Test Customer',
      phoneNumber: '+923001234567',
      addressLine1: '123 Test Street',
      city: 'Karachi',
    },
    subtotal: '25.00',
    deliveryFee: '5.00',
    total: '30.00',
    assignedAt: new Date('2026-01-01T00:00:00.000Z'),
    pickedUpAt: null,
    deliveredAt: null,
    cancelledAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    items: [],
    rider: null,
  };

  beforeEach(() => {
    repository = {
      checkout: jest.fn(),
      findByUser: jest.fn(),
      findByIdForUser: jest.fn(),
      findByIdForRider: jest.fn(),
      findCurrentByRider: jest.fn(),
      transitionStatus: jest.fn(),
      cancelAssigned: jest.fn(),
    };
    service = new OrdersService(repository);
  });

  it('returns the transaction-created order', async () => {
    repository.checkout.mockResolvedValue({ order });

    await expect(
      service.checkout('user-id', {
        deliveryAddress: order.deliveryAddress,
      }),
    ).resolves.toBe(order);
    expect(repository.checkout).toHaveBeenCalledWith(
      'user-id',
      order.deliveryAddress,
      '5.00',
    );
  });

  it('rejects checkout when no rider is available', async () => {
    repository.checkout.mockResolvedValue({ failure: 'NO_AVAILABLE_RIDER' });

    await expect(
      service.checkout('user-id', {
        deliveryAddress: order.deliveryAddress,
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('maps cart validation failures to bad requests', async () => {
    repository.checkout.mockResolvedValue({ failure: 'INSUFFICIENT_STOCK' });

    await expect(
      service.checkout('user-id', {
        deliveryAddress: order.deliveryAddress,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('allows an assigned rider to mark an order picked up', async () => {
    repository.findByIdForRider.mockResolvedValue(order);
    repository.transitionStatus.mockResolvedValue({
      ...order,
      status: 'picked_up',
    });

    await service.updateRiderStatus('order-id', 'rider-user-id', 'picked_up');

    expect(repository.transitionStatus).toHaveBeenCalledWith(
      'order-id',
      'rider-profile-id',
      'assigned',
      'picked_up',
    );
  });

  it('rejects invalid rider status transitions', async () => {
    repository.findByIdForRider.mockResolvedValue(order);

    await expect(
      service.updateRiderStatus('order-id', 'rider-user-id', 'delivered'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.transitionStatus).not.toHaveBeenCalled();
  });
});
