import {
    pgTable,
    pgEnum,
    uuid,
    text,
    timestamp,
    index,
    unique,
} from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { users } from './users.schema';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const applicationTypeEnum = pgEnum('application_type', [
    'seller',
    'rider',
]);

export const applicationStatusEnum = pgEnum('application_status', [
    'pending',
    'approved',
    'rejected',
]);

export type ApplicationType = (typeof applicationTypeEnum.enumValues)[number];
export type ApplicationStatus =
    (typeof applicationStatusEnum.enumValues)[number];

// ─── Table ────────────────────────────────────────────────────────────────────

export const applications = pgTable(
    'applications',
    {
        id: uuid('id')
            .primaryKey()
            .default(sql`gen_random_uuid()`),
        userId: uuid('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        type: applicationTypeEnum('type').notNull(),
        status: applicationStatusEnum('status').notNull().default('pending'),
        /**
         * The admin user who reviewed this application.
         * NULL until an admin takes action (approve/reject).
         */
        reviewedBy: uuid('reviewed_by').references(() => users.id, {
            onDelete: 'set null',
        }),
        reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
        /**
         * Populated when status = 'rejected'.
         */
        rejectionReason: text('rejection_reason'),
        createdAt: timestamp('created_at', { withTimezone: true })
            .notNull()
            .default(sql`now()`),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .notNull()
            .default(sql`now()`),
    },
    (table) => [
        // Fast lookups by applicant
        index('applications_user_id_idx').on(table.userId),
        // Fast lookups by type & status (common admin dashboard filters)
        index('applications_type_idx').on(table.type),
        index('applications_status_idx').on(table.status),
        // Composite index for the most common admin query: filter by type + status
        index('applications_type_status_idx').on(table.type, table.status),
        // Prevent duplicate PENDING applications for the same user+type.
        // A user may have at most one pending application per type at a time.
        // (Past approved/rejected applications are intentionally allowed to remain.)
        unique('applications_user_id_type_pending_unique').on(
            table.userId,
            table.type,
            table.status,
        ),
    ],
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const applicationsRelations = relations(applications, ({ one }) => ({
    /** The user who submitted this application */
    user: one(users, {
        fields: [applications.userId],
        references: [users.id],
        relationName: 'applicant',
    }),
    /** The admin who reviewed this application */
    reviewer: one(users, {
        fields: [applications.reviewedBy],
        references: [users.id],
        relationName: 'reviewer',
    }),
}));

// ─── Types ────────────────────────────────────────────────────────────────────

export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
