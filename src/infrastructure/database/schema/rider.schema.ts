import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import {
  RIDER_VEHICLE_TYPES,
  type RiderVehicleType as DomainRiderVehicleType,
} from '@/modules/rider/entities/rider.entity';
import { users } from './users.schema';

export const riderVehicleTypeEnum = pgEnum(
  'rider_vehicle_type',
  RIDER_VEHICLE_TYPES,
);

export type RiderVehicleType = DomainRiderVehicleType;

export const riderProfiles = pgTable(
  'rider_profiles',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    vehicleType: riderVehicleTypeEnum('vehicle_type').notNull(),
    vehicleMake: varchar('vehicle_make', { length: 100 }),
    vehicleModel: varchar('vehicle_model', { length: 100 }),
    vehicleColor: varchar('vehicle_color', { length: 50 }),
    plateNumber: varchar('plate_number', { length: 30 }),
    licenseNumber: varchar('license_number', { length: 100 }),
    isAvailable: boolean('is_available').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    uniqueIndex('rider_profiles_user_id_unique').on(table.userId),
    uniqueIndex('rider_profiles_plate_number_unique').on(table.plateNumber),
    uniqueIndex('rider_profiles_license_number_unique').on(table.licenseNumber),
    index('rider_profiles_is_available_idx').on(table.isAvailable),
  ],
);

export const riderProfilesRelations = relations(riderProfiles, ({ one }) => ({
  user: one(users, {
    fields: [riderProfiles.userId],
    references: [users.id],
  }),
}));

export type RiderProfile = typeof riderProfiles.$inferSelect;
export type NewRiderProfile = typeof riderProfiles.$inferInsert;
