import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { users } from './users.schema';
import { authSessions } from './auth-sessions.schema';

export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => authSessions.id, { onDelete: 'cascade' }),
    /**
   * bcrypt hash of the raw refresh token.
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
  },
  (table) => [index('refresh_tokens_session_id_idx').on(table.sessionId)],
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  /** The user who owns this refresh token */
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
  session: one(authSessions, {
    fields: [refreshTokens.sessionId],
    references: [authSessions.id],
  }),
}));

// ─── Types ────────────────────────────────────────────────────────────────────

export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;
