import { Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import type {
  CartItemRecord,
  PurchasableProduct,
} from '@/modules/cart/entities/cart.entity';
import { ICartRepository } from '@/modules/cart/interfaces/cart.repository.interface';
import { DatabaseService } from '../../database.service';
import { cartItems, products, stores } from '../../schema';

@Injectable()
export class DrizzleCartRepository implements ICartRepository {
  constructor(private readonly db: DatabaseService) {}

  async findByUser(userId: string): Promise<CartItemRecord[]> {
    return this.db.client
      .select({
        quantity: cartItems.quantity,
        product: products,
        store: {
          id: stores.id,
          name: stores.name,
          slug: stores.slug,
        },
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .innerJoin(stores, eq(products.storeId, stores.id))
      .where(eq(cartItems.userId, userId));
  }

  async findItemQuantity(userId: string, productId: string): Promise<number> {
    const [item] = await this.db.client
      .select({ quantity: cartItems.quantity })
      .from(cartItems)
      .where(
        and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)),
      )
      .limit(1);

    return item?.quantity ?? 0;
  }

  async findPurchasableProduct(
    productId: string,
  ): Promise<PurchasableProduct | undefined> {
    const [product] = await this.db.client
      .select({ id: products.id, stock: products.stock })
      .from(products)
      .innerJoin(stores, eq(products.storeId, stores.id))
      .where(
        and(
          eq(products.id, productId),
          eq(products.status, 'active'),
          eq(stores.status, 'active'),
        ),
      )
      .limit(1);

    return product;
  }

  async incrementItem(
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<void> {
    await this.db.client
      .insert(cartItems)
      .values({ userId, productId, quantity })
      .onConflictDoUpdate({
        target: [cartItems.userId, cartItems.productId],
        set: {
          quantity: sql`${cartItems.quantity} + ${quantity}`,
          updatedAt: new Date(),
        },
      });
  }

  async updateItem(
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<boolean> {
    const updated = await this.db.client
      .update(cartItems)
      .set({ quantity, updatedAt: new Date() })
      .where(
        and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)),
      )
      .returning({ productId: cartItems.productId });

    return updated.length > 0;
  }

  async deleteItem(userId: string, productId: string): Promise<void> {
    await this.db.client
      .delete(cartItems)
      .where(
        and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)),
      );
  }

  async clear(userId: string): Promise<void> {
    await this.db.client.delete(cartItems).where(eq(cartItems.userId, userId));
  }
}
