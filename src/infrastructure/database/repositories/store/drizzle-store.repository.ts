import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DatabaseService } from '../../database.service';
import { stores } from '../../schema';
import { IStoreRepository } from '@/modules/seller/store/interfaces/store.repository.interface';
import {
  CreateStoreData,
  Store,
  UpdateStoreData,
} from '@/modules/seller/store/entities/store.entity';

@Injectable()
export class DrizzleStoreRepository implements IStoreRepository {
  constructor(private readonly db: DatabaseService) {}

  async createStore(store: CreateStoreData): Promise<Store> {
    const result = await this.db.client
      .insert(stores)
      .values(store)
      .returning();
    return this.toEntity(result[0]);
  }

  async findBySlug(slug: string): Promise<Store | undefined> {
    const result = await this.db.client
      .select()
      .from(stores)
      .where(eq(stores.slug, slug))
      .limit(1);
    return result[0] ? this.toEntity(result[0]) : undefined;
  }

  async findBySellerId(sellerId: string): Promise<Store[]> {
    const result = await this.db.client
      .select()
      .from(stores)
      .where(eq(stores.sellerId, sellerId));
    return result.map((store) => this.toEntity(store));
  }

  async findById(id: string): Promise<Store | undefined> {
    const result = await this.db.client
      .select()
      .from(stores)
      .where(eq(stores.id, id))
      .limit(1);
    return result[0] ? this.toEntity(result[0]) : undefined;
  }

  async updateStore(id: string, data: UpdateStoreData): Promise<Store> {
    const result = await this.db.client
      .update(stores)
      .set(data)
      .where(eq(stores.id, id))
      .returning();
    return this.toEntity(result[0]);
  }

  async deleteStore(id: string): Promise<void> {
    await this.db.client
      .delete(stores)
      .where(eq(stores.id, id));
  }

  private toEntity(record: typeof stores.$inferSelect): Store {
    return {
      id: record.id,
      sellerId: record.sellerId,
      name: record.name,
      slug: record.slug,
      description: record.description,
      profileImageUrl: record.profileImageUrl,
      profileImagePublicId: record.profileImagePublicId,
      coverImageUrl: record.coverImageUrl,
      coverImagePublicId: record.coverImagePublicId,
      status: record.status,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
