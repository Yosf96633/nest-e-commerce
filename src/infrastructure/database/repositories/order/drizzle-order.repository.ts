import { Injectable } from '@nestjs/common';
import { and, asc, desc, eq, gte, inArray, sql, type SQL } from 'drizzle-orm';
import type {
  AssignedRider,
  CheckoutFailure,
  CheckoutResult,
  DeliveryAddress,
  Order,
  OrderDetails,
  OrderItem,
  OrderStatus,
} from '@/modules/orders/entities/order.entity';
import { IOrderRepository } from '@/modules/orders/interfaces/order.repository.interface';
import { DatabaseService } from '../../database.service';
import {
  cartItems,
  orderItems,
  orders,
  products,
  riderProfiles,
  stores,
  users,
} from '../../schema';

@Injectable()
export class DrizzleOrderRepository implements IOrderRepository {
  constructor(private readonly db: DatabaseService) {}

  async checkout(
    userId: string,
    deliveryAddress: DeliveryAddress,
    deliveryFee: string,
  ): Promise<CheckoutResult> {
    const outcome: { orderId: string } | { failure: CheckoutFailure } =
      await this.db.client.transaction(async (tx) => {
        const cart = await tx
          .select({
            quantity: cartItems.quantity,
            product: products,
            storeStatus: stores.status,
          })
          .from(cartItems)
          .innerJoin(products, eq(cartItems.productId, products.id))
          .innerJoin(stores, eq(products.storeId, stores.id))
          .where(eq(cartItems.userId, userId))
          .for('update');

        if (!cart.length) return { failure: 'EMPTY_CART' };
        if (
          cart.some(
            ({ product, storeStatus }) =>
              product.status !== 'active' || storeStatus !== 'active',
          )
        ) {
          return { failure: 'PRODUCT_UNAVAILABLE' };
        }
        if (cart.some(({ product, quantity }) => product.stock < quantity)) {
          return { failure: 'INSUFFICIENT_STOCK' };
        }

        const [rider] = await tx
          .select({ id: riderProfiles.id })
          .from(riderProfiles)
          .where(eq(riderProfiles.isAvailable, true))
          .orderBy(asc(riderProfiles.updatedAt))
          .limit(1)
          .for('update', { skipLocked: true });
        if (!rider) return { failure: 'NO_AVAILABLE_RIDER' };

        const subtotalCents = cart.reduce(
          (total, { product, quantity }) =>
            total + Math.round(Number(product.price) * 100) * quantity,
          0,
        );
        const deliveryFeeCents = Math.round(Number(deliveryFee) * 100);
        const [order] = await tx
          .insert(orders)
          .values({
            userId,
            riderProfileId: rider.id,
            deliveryAddress,
            subtotal: this.centsToDecimal(subtotalCents),
            deliveryFee: this.centsToDecimal(deliveryFeeCents),
            total: this.centsToDecimal(subtotalCents + deliveryFeeCents),
          })
          .returning({ id: orders.id });

        await tx.insert(orderItems).values(
          cart.map(({ product, quantity }) => ({
            orderId: order.id,
            productId: product.id,
            productName: product.name,
            productImage: product.images[0] ?? null,
            unitPrice: product.price,
            quantity,
            lineTotal: this.centsToDecimal(
              Math.round(Number(product.price) * 100) * quantity,
            ),
          })),
        );

        for (const { product, quantity } of cart) {
          const updated = await tx
            .update(products)
            .set({
              stock: sql`${products.stock} - ${quantity}`,
              updatedAt: new Date(),
            })
            .where(
              and(eq(products.id, product.id), gte(products.stock, quantity)),
            )
            .returning({ id: products.id });
          if (!updated.length) throw new Error('CHECKOUT_STOCK_RACE');
        }

        await tx
          .update(riderProfiles)
          .set({ isAvailable: false, updatedAt: new Date() })
          .where(eq(riderProfiles.id, rider.id));
        await tx.delete(cartItems).where(eq(cartItems.userId, userId));

        return { orderId: order.id };
      });

    if ('failure' in outcome) return outcome;
    const order = await this.loadOne(eq(orders.id, outcome.orderId));
    if (!order) throw new Error('Created order could not be loaded');
    return { order };
  }

  findByUser(userId: string): Promise<OrderDetails[]> {
    return this.loadMany(eq(orders.userId, userId));
  }

  findByIdForUser(
    orderId: string,
    userId: string,
  ): Promise<OrderDetails | undefined> {
    return this.loadOne(
      and(eq(orders.id, orderId), eq(orders.userId, userId))!,
    );
  }

  findByIdForRider(
    orderId: string,
    riderUserId: string,
  ): Promise<OrderDetails | undefined> {
    return this.loadOne(
      and(eq(orders.id, orderId), eq(users.id, riderUserId))!,
    );
  }

  findCurrentByRider(riderUserId: string): Promise<OrderDetails[]> {
    return this.loadMany(
      and(
        eq(users.id, riderUserId),
        inArray(orders.status, ['assigned', 'picked_up']),
      )!,
    );
  }

  async transitionStatus(
    orderId: string,
    riderProfileId: string,
    currentStatus: OrderStatus,
    nextStatus: OrderStatus,
  ): Promise<OrderDetails | undefined> {
    const changed = await this.db.client.transaction(async (tx) => {
      const now = new Date();
      const [updated] = await tx
        .update(orders)
        .set({
          status: nextStatus,
          updatedAt: now,
          ...(nextStatus === 'picked_up' ? { pickedUpAt: now } : {}),
          ...(nextStatus === 'delivered' ? { deliveredAt: now } : {}),
        })
        .where(
          and(
            eq(orders.id, orderId),
            eq(orders.riderProfileId, riderProfileId),
            eq(orders.status, currentStatus),
          ),
        )
        .returning({ id: orders.id });
      if (!updated) return false;

      if (nextStatus === 'delivered') {
        await tx
          .update(riderProfiles)
          .set({ isAvailable: true, updatedAt: now })
          .where(eq(riderProfiles.id, riderProfileId));
      }
      return true;
    });

    return changed ? this.loadOne(eq(orders.id, orderId)) : undefined;
  }

  async cancelAssigned(
    orderId: string,
    userId: string,
  ): Promise<OrderDetails | undefined> {
    const changed = await this.db.client.transaction(async (tx) => {
      const now = new Date();
      const [cancelled] = await tx
        .update(orders)
        .set({ status: 'cancelled', cancelledAt: now, updatedAt: now })
        .where(
          and(
            eq(orders.id, orderId),
            eq(orders.userId, userId),
            eq(orders.status, 'assigned'),
          ),
        )
        .returning({ riderProfileId: orders.riderProfileId });
      if (!cancelled) return false;

      if (cancelled.riderProfileId) {
        await tx
          .update(riderProfiles)
          .set({ isAvailable: true, updatedAt: now })
          .where(eq(riderProfiles.id, cancelled.riderProfileId));
      }
      const items = await tx
        .select({
          productId: orderItems.productId,
          quantity: orderItems.quantity,
        })
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));
      for (const item of items) {
        if (item.productId) {
          await tx
            .update(products)
            .set({
              stock: sql`${products.stock} + ${item.quantity}`,
              updatedAt: now,
            })
            .where(eq(products.id, item.productId));
        }
      }
      return true;
    });

    return changed ? this.loadOne(eq(orders.id, orderId)) : undefined;
  }

  private async loadOne(condition: SQL): Promise<OrderDetails | undefined> {
    const records = await this.loadMany(condition);
    return records[0];
  }

  private async loadMany(condition: SQL): Promise<OrderDetails[]> {
    const rows = await this.db.client
      .select({
        order: orders,
        rider: {
          profileId: riderProfiles.id,
          userId: riderProfiles.userId,
          firstName: users.firstName,
          lastName: users.lastName,
          phoneNumber: users.phoneNumber,
          vehicleType: riderProfiles.vehicleType,
          plateNumber: riderProfiles.plateNumber,
        },
      })
      .from(orders)
      .leftJoin(riderProfiles, eq(orders.riderProfileId, riderProfiles.id))
      .leftJoin(users, eq(riderProfiles.userId, users.id))
      .where(condition)
      .orderBy(desc(orders.createdAt));

    if (!rows.length) return [];
    const items = await this.db.client
      .select()
      .from(orderItems)
      .where(
        inArray(
          orderItems.orderId,
          rows.map(({ order }) => order.id),
        ),
      );
    const itemsByOrder = new Map<string, OrderItem[]>();
    for (const item of items) {
      const mapped = this.toItem(item);
      itemsByOrder.set(item.orderId, [
        ...(itemsByOrder.get(item.orderId) ?? []),
        mapped,
      ]);
    }

    return rows.map(({ order, rider }) => ({
      ...this.toOrder(order),
      rider: rider?.profileId ? (rider as AssignedRider) : null,
      items: itemsByOrder.get(order.id) ?? [],
    }));
  }

  private toOrder(record: typeof orders.$inferSelect): Order {
    return { ...record };
  }

  private toItem(record: typeof orderItems.$inferSelect): OrderItem {
    return {
      id: record.id,
      orderId: record.orderId,
      productId: record.productId,
      productName: record.productName,
      productImage: record.productImage,
      unitPrice: record.unitPrice,
      quantity: record.quantity,
      lineTotal: record.lineTotal,
    };
  }

  private centsToDecimal(cents: number): string {
    return (cents / 100).toFixed(2);
  }
}
