import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { DatabaseService } from '@/infrastructure/database/database.service';
import { cartItems } from '@/infrastructure/database/schema/cart.schema';
import { products } from '@/infrastructure/database/schema/product.schema';
import { stores } from '@/infrastructure/database/schema/store.schema';
import { AddCartItemDto } from './dto/add-cart-item.dto';

@Injectable()
export class CartService {
  constructor(private readonly db: DatabaseService) {}

  async get(userId: string) {
    const rows = await this.db.client.select({ quantity: cartItems.quantity, product: products, store: { id: stores.id, name: stores.name, slug: stores.slug } })
      .from(cartItems).innerJoin(products, eq(cartItems.productId, products.id)).innerJoin(stores, eq(products.storeId, stores.id)).where(eq(cartItems.userId, userId));
    const items = rows.map(({ quantity, product, store }) => ({ product: { ...product, store }, quantity, lineTotal: (Number(product.price) * quantity).toFixed(2) }));
    return { items, itemCount: items.reduce((sum, item) => sum + item.quantity, 0), subtotal: items.reduce((sum, item) => sum + Number(item.lineTotal), 0).toFixed(2) };
  }

  private async assertPurchasable(productId: string, quantity: number) {
    const [product] = await this.db.client.select({ id: products.id, stock: products.stock }).from(products)
      .innerJoin(stores, eq(products.storeId, stores.id))
      .where(and(eq(products.id, productId), eq(products.status, 'active'), eq(stores.status, 'active'))).limit(1);
    if (!product) throw new NotFoundException('Active product not found', 'PRODUCT_NOT_FOUND');
    if (product.stock < quantity) throw new BadRequestException('Requested quantity exceeds available stock', 'INSUFFICIENT_STOCK');
  }

  async add(userId: string, dto: AddCartItemDto) {
    const [existing] = await this.db.client.select({ quantity: cartItems.quantity }).from(cartItems)
      .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, dto.productId))).limit(1);
    await this.assertPurchasable(dto.productId, (existing?.quantity ?? 0) + dto.quantity);
    await this.db.client.insert(cartItems).values({ userId, productId: dto.productId, quantity: dto.quantity })
      .onConflictDoUpdate({ target: [cartItems.userId, cartItems.productId], set: { quantity: sql`${cartItems.quantity} + ${dto.quantity}`, updatedAt: new Date() } });
    return this.get(userId);
  }

  async update(userId: string, productId: string, quantity: number) {
    await this.assertPurchasable(productId, quantity);
    const updated = await this.db.client.update(cartItems).set({ quantity, updatedAt: new Date() })
      .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId))).returning();
    if (!updated.length) throw new NotFoundException('Cart item not found', 'CART_ITEM_NOT_FOUND');
    return this.get(userId);
  }

  async remove(userId: string, productId: string) {
    await this.db.client.delete(cartItems).where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)));
    return this.get(userId);
  }

  async clear(userId: string) {
    await this.db.client.delete(cartItems).where(eq(cartItems.userId, userId));
    return { message: 'Cart cleared' };
  }
}
