import { relations, sql } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import {
  ORDER_STATUSES,
  type DeliveryAddress,
  type OrderStatus as DomainOrderStatus,
} from '@/modules/orders/entities/order.entity';
import type { ProductImage } from '@/modules/seller/product/entities/product.entity';
import { products } from './product.schema';
import { riderProfiles } from './rider.schema';
import { users } from './users.schema';

export const orderStatusEnum = pgEnum('order_status', ORDER_STATUSES);
export type OrderStatus = DomainOrderStatus;

export const orders = pgTable(
  'orders',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    riderProfileId: uuid('rider_profile_id').references(
      () => riderProfiles.id,
      { onDelete: 'set null' },
    ),
    status: orderStatusEnum('status').notNull().default('assigned'),
    deliveryAddress: jsonb('delivery_address')
      .$type<DeliveryAddress>()
      .notNull(),
    subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
    deliveryFee: numeric('delivery_fee', { precision: 12, scale: 2 }).notNull(),
    total: numeric('total', { precision: 12, scale: 2 }).notNull(),
    assignedAt: timestamp('assigned_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    pickedUpAt: timestamp('picked_up_at', { withTimezone: true }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    index('orders_user_id_created_at_idx').on(table.userId, table.createdAt),
    index('orders_rider_profile_id_status_idx').on(
      table.riderProfileId,
      table.status,
    ),
    index('orders_status_idx').on(table.status),
  ],
);

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    productId: uuid('product_id').references(() => products.id, {
      onDelete: 'set null',
    }),
    productName: varchar('product_name', { length: 255 }).notNull(),
    productImage: jsonb('product_image').$type<ProductImage>(),
    unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
    quantity: integer('quantity').notNull(),
    lineTotal: numeric('line_total', { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [index('order_items_order_id_idx').on(table.orderId)],
);

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(users, { fields: [orders.userId], references: [users.id] }),
  rider: one(riderProfiles, {
    fields: [orders.riderProfileId],
    references: [riderProfiles.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
