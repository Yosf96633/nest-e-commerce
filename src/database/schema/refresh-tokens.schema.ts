import { pgTable, uuid, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users.schema';

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  /**
   * SHA-256 hash of the raw refresh token.
   * Raw token is NEVER persisted.
   */
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  /**
   * NULL = active. Set to a timestamp when revoked.
   */
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  /**
   * Points to the next token in the rotation chain.
   * Enables reuse-detection: if this token is already revoked,
   * we can walk the chain and revoke any still-active descendants.
   */
  replacedBy: uuid('replaced_by'),
  /** Optional device/session metadata */
  userAgent: text('user_agent'),
  ipAddress: varchar('ip_address', { length: 45 }),
});

export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;
