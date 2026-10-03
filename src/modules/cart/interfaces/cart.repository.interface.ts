import type {
  CartItemRecord,
  PurchasableProduct,
} from '../entities/cart.entity';

export interface ICartRepository {
  findByUser(userId: string): Promise<CartItemRecord[]>;
  findItemQuantity(userId: string, productId: string): Promise<number>;
  findPurchasableProduct(
    productId: string,
  ): Promise<PurchasableProduct | undefined>;
  incrementItem(
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<void>;
  updateItem(
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<boolean>;
  deleteItem(userId: string, productId: string): Promise<void>;
  clear(userId: string): Promise<void>;
}

export const ICartRepository = Symbol('ICartRepository');
