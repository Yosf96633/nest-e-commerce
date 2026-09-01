import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { users } from './users.schema';

export const emailVerificationTokens = pgTable('email_verification_tokens', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  /**
   * SHA-256 hash of the raw verification token.
   * Raw token is emailed to the user but never persisted.
   */
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  /**
   * NULL = not yet consumed. Set when the user clicks the link and
   * successfully verifies. Prevents token reuse.
   */
  consumedAt: timestamp('consumed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const emailVerificationTokensRelations = relations(
  emailVerificationTokens,
  ({ one }) => ({
    /** The user who this verification token belongs to */
    user: one(users, {
      fields: [emailVerificationTokens.userId],
      references: [users.id],
    }),
  }),
);

// ─── Types ────────────────────────────────────────────────────────────────────

export type EmailVerificationToken =
  typeof emailVerificationTokens.$inferSelect;
export type NewEmailVerificationToken =
  typeof emailVerificationTokens.$inferInsert;
