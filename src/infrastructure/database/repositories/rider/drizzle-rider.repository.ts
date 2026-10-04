import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type {
  CreateRiderProfileData,
  RiderProfile,
  UpdateRiderProfileData,
} from '@/modules/rider/entities/rider.entity';
import { IRiderRepository } from '@/modules/rider/interfaces/rider.repository.interface';
import { DatabaseService } from '../../database.service';
import { riderProfiles } from '../../schema';

@Injectable()
export class DrizzleRiderRepository implements IRiderRepository {
  constructor(private readonly db: DatabaseService) {}

  async findByUserId(userId: string): Promise<RiderProfile | undefined> {
    const [record] = await this.db.client
      .select()
      .from(riderProfiles)
      .where(eq(riderProfiles.userId, userId))
      .limit(1);

    return record ? this.toEntity(record) : undefined;
  }

  async create(
    data: CreateRiderProfileData,
  ): Promise<RiderProfile | undefined> {
    const [record] = await this.db.client
      .insert(riderProfiles)
      .values(data)
      .onConflictDoNothing()
      .returning();

    return record ? this.toEntity(record) : undefined;
  }

  async update(
    userId: string,
    data: UpdateRiderProfileData,
  ): Promise<RiderProfile | undefined> {
    const [record] = await this.db.client
      .update(riderProfiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(riderProfiles.userId, userId))
      .returning();

    return record ? this.toEntity(record) : undefined;
  }

  async updateAvailability(
    userId: string,
    isAvailable: boolean,
  ): Promise<RiderProfile | undefined> {
    const [record] = await this.db.client
      .update(riderProfiles)
      .set({ isAvailable, updatedAt: new Date() })
      .where(eq(riderProfiles.userId, userId))
      .returning();

    return record ? this.toEntity(record) : undefined;
  }

  private toEntity(record: typeof riderProfiles.$inferSelect): RiderProfile {
    return {
      id: record.id,
      userId: record.userId,
      vehicleType: record.vehicleType,
      vehicleMake: record.vehicleMake,
      vehicleModel: record.vehicleModel,
      vehicleColor: record.vehicleColor,
      plateNumber: record.plateNumber,
      licenseNumber: record.licenseNumber,
      isAvailable: record.isAvailable,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
