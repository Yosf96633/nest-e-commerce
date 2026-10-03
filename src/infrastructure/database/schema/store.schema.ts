import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { users } from './users.schema';
import { refreshTokens } from './refresh-tokens.schema';
import { emailVerificationTokens } from './email-verification-tokens.schema';
import { userRoles } from './user-roles.schema';
import { applications } from './application.schema';
import { products } from './product.schema';
import { reviews } from './review.schema';
import {
  STORE_STATUSES,
  type StoreStatus as DomainStoreStatus,
} from '@/modules/seller/store/entities/store.entity';

// ─── Enum ─────────────────────────────────────────────────────────────────────

export const storeStatusEnum = pgEnum('store_status', STORE_STATUSES);

export type StoreStatus = DomainStoreStatus;

// ─── Table ────────────────────────────────────────────────────────────────────

export const stores = pgTable(
  'stores',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    /**
     * The seller who owns this store.
     * Role authorization (seller check) is enforced at the service layer,
     * NOT via a database constraint.
     */
    sellerId: uuid('seller_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    /**
     * URL-friendly unique identifier for the store.
     * E.g. "johns-electronics"
     */
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    description: text('description'),
    /**
     * Cloudinary profile picture for the store.
     * NULL until the seller uploads one.
     */
    profileImageUrl: text('profile_image_url'),
    profileImagePublicId: text('profile_image_public_id'),
    /**
     * Cloudinary cover/banner image for the store.
     * NULL until the seller uploads one.
     */
    coverImageUrl: text('cover_image_url'),
    coverImagePublicId: text('cover_image_public_id'),
    status: storeStatusEnum('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    // Seller's stores dashboard / ownership checks
    index('stores_seller_id_idx').on(table.sellerId),
    // Slug is already UNIQUE (constraint), this index backs that constraint
    index('stores_slug_idx').on(table.slug),
  ],
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const storesRelations = relations(stores, ({ one, many }) => ({
  /** The seller who owns this store */
  seller: one(users, {
    fields: [stores.sellerId],
    references: [users.id],
  }),
  /** Products listed in this store */
  products: many(products),
}));

/**
 * Augments the `users` table with all relations that require schemas
 * defined after users.schema.ts (applications, stores).
 * Defined here to avoid circular imports.
 */
export const usersRelations = relations(users, ({ many }) => ({
  /** Active/past refresh tokens for this user */
  refreshTokens: many(refreshTokens),
  /** Email verification tokens issued to this user */
  emailVerificationTokens: many(emailVerificationTokens),
  /** Roles assigned to this user */
  roles: many(userRoles),
  /** Applications submitted by this user as an applicant */
  submittedApplications: many(applications, { relationName: 'applicant' }),
  /** Applications reviewed by this user as an admin */
  reviewedApplications: many(applications, { relationName: 'reviewer' }),
  /** Stores owned by this user as a seller */
  stores: many(stores),
  /** Product reviews written by this user */
  reviews: many(reviews),
}));

// ─── Types ────────────────────────────────────────────────────────────────────

export type Store = typeof stores.$inferSelect;
export type NewStore = typeof stores.$inferInsert;
