import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Cart } from './entities/cart.entity';
import { ICartRepository } from './interfaces/cart.repository.interface';
import { AddCartItemDto } from './dto/add-cart-item.dto';

@Injectable()
export class CartService {
  constructor(
    @Inject(ICartRepository)
    private readonly cartRepository: ICartRepository,
  ) {}

  async get(userId: string): Promise<Cart> {
    const rows = await this.cartRepository.findByUser(userId);
    const items = rows.map(({ quantity, product, store }) => ({
      product: { ...product, store },
      quantity,
      lineTotal: (Number(product.price) * quantity).toFixed(2),
    }));

    return {
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: items
        .reduce((sum, item) => sum + Number(item.lineTotal), 0)
        .toFixed(2),
    };
  }

  async add(userId: string, dto: AddCartItemDto): Promise<Cart> {
    const existingQuantity = await this.cartRepository.findItemQuantity(
      userId,
      dto.productId,
    );
    await this.assertPurchasable(
      dto.productId,
      existingQuantity + dto.quantity,
    );
    await this.cartRepository.incrementItem(
      userId,
      dto.productId,
      dto.quantity,
    );

    return this.get(userId);
  }

  async update(
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<Cart> {
    await this.assertPurchasable(productId, quantity);
    const updated = await this.cartRepository.updateItem(
      userId,
      productId,
      quantity,
    );
    if (!updated) {
      throw new NotFoundException('Cart item not found', 'CART_ITEM_NOT_FOUND');
    }

    return this.get(userId);
  }

  async remove(userId: string, productId: string): Promise<Cart> {
    await this.cartRepository.deleteItem(userId, productId);
    return this.get(userId);
  }

  async clear(userId: string): Promise<{ message: string }> {
    await this.cartRepository.clear(userId);
    return { message: 'Cart cleared' };
  }

  private async assertPurchasable(
    productId: string,
    quantity: number,
  ): Promise<void> {
    const product = await this.cartRepository.findPurchasableProduct(productId);
    if (!product) {
      throw new NotFoundException(
        'Active product not found',
        'PRODUCT_NOT_FOUND',
      );
    }
    if (product.stock < quantity) {
      throw new BadRequestException(
        'Requested quantity exceeds available stock',
        'INSUFFICIENT_STOCK',
      );
    }
  }
}
