import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  numeric,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { stores } from './store.schema';

// ─── Enum ─────────────────────────────────────────────────────────────────────

export const productStatusEnum = pgEnum('product_status', [
  'draft',
  'active',
  'inactive',
]);

export type ProductStatus = (typeof productStatusEnum.enumValues)[number];

// ─── Table ────────────────────────────────────────────────────────────────────

export const products = pgTable(
  'products',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    /**
     * The store this product belongs to.
     * Ownership chain: product → store → seller (user).
     */
    storeId: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    /**
     * URL-friendly unique identifier scoped within a store.
     * Uniqueness is enforced globally for simplicity (can be tightened
     * to per-store unique via a composite index if needed later).
     */
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    description: text('description'),
    /**
     * Price stored as NUMERIC(12, 2) — exact decimal, no floating-point errors.
     * Represents the value in the store's base currency (e.g. USD).
     */
    price: numeric('price', { precision: 12, scale: 2 }).notNull(),
    /**
     * Non-negative stock quantity.
     * Application layer is responsible for preventing stock from going below 0.
     */
    stock: integer('stock').notNull().default(0),
    status: productStatusEnum('status').notNull().default('draft'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    // Store's product listings
    index('products_store_id_idx').on(table.storeId),
    // Slug is already UNIQUE (constraint), this index backs that constraint
    index('products_slug_idx').on(table.slug),
    // Composite: store_id + status is a very common query (active products per store)
    index('products_store_id_status_idx').on(table.storeId, table.status),
  ],
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const productsRelations = relations(products, ({ one }) => ({
  /** The store that owns this product */
  store: one(stores, {
    fields: [products.storeId],
    references: [stores.id],
  }),
}));

// ─── Types ────────────────────────────────────────────────────────────────────

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
