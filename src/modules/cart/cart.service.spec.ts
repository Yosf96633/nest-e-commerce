import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { ICartRepository } from './interfaces/cart.repository.interface';
import { CartService } from './cart.service';

describe('CartService', () => {
  let repository: jest.Mocked<ICartRepository>;
  let service: CartService;

  beforeEach(() => {
    repository = {
      findByUser: jest.fn(),
      findItemQuantity: jest.fn(),
      findPurchasableProduct: jest.fn(),
      incrementItem: jest.fn(),
      updateItem: jest.fn(),
      deleteItem: jest.fn(),
      clear: jest.fn(),
    };
    service = new CartService(repository);
  });

  it('calculates cart item count, line totals, and subtotal', async () => {
    repository.findByUser.mockResolvedValue([
      {
        quantity: 2,
        product: {
          id: 'product-id',
          storeId: 'store-id',
          name: 'Product',
          slug: 'product',
          description: null,
          price: '12.50',
          stock: 10,
          images: [],
          status: 'active',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        },
        store: { id: 'store-id', name: 'Store', slug: 'store' },
      },
    ]);

    await expect(service.get('user-id')).resolves.toMatchObject({
      itemCount: 2,
      subtotal: '25.00',
      items: [{ quantity: 2, lineTotal: '25.00' }],
    });
  });

  it('checks cumulative quantity before adding an item', async () => {
    repository.findItemQuantity.mockResolvedValue(3);
    repository.findPurchasableProduct.mockResolvedValue({
      id: 'product-id',
      stock: 4,
    });

    await expect(
      service.add('user-id', { productId: 'product-id', quantity: 2 }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.incrementItem).not.toHaveBeenCalled();
  });

  it('rejects inactive or missing products', async () => {
    repository.findItemQuantity.mockResolvedValue(0);
    repository.findPurchasableProduct.mockResolvedValue(undefined);

    await expect(
      service.add('user-id', { productId: 'product-id', quantity: 1 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects updates for cart items that do not exist', async () => {
    repository.findPurchasableProduct.mockResolvedValue({
      id: 'product-id',
      stock: 10,
    });
    repository.updateItem.mockResolvedValue(false);

    await expect(
      service.update('user-id', 'product-id', 2),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
