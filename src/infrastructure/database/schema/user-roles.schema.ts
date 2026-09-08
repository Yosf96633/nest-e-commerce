import { pgTable, uuid, varchar, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users.schema';
import { ROLE_VALUES, type Role } from '@/common/types/role.type';

export const roleEnum = ROLE_VALUES;
export type { Role };


export const userRoles = pgTable(
  'user_roles',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: varchar('role', { length: 20 })
      .$type<Role>()
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.role] })],
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  /** The user who holds this role */
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
}));

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;
