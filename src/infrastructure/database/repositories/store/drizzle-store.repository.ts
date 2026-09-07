import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DatabaseService } from '../../database.service';
import { stores, Store, NewStore } from '../../schema';
import { IStoreRepository } from '@/modules/seller/store/interfaces/store.repository.interface';

@Injectable()
export class DrizzleStoreRepository implements IStoreRepository {
  constructor(private readonly db: DatabaseService) {}

  async createStore(store: NewStore): Promise<Store> {
    const result = await this.db.client
      .insert(stores)
      .values(store)
      .returning();
    return result[0];
  }

  async findBySlug(slug: string): Promise<Store | undefined> {
    const result = await this.db.client
      .select()
      .from(stores)
      .where(eq(stores.slug, slug))
      .limit(1);
    return result[0];
  }

  async findBySellerId(sellerId: string): Promise<Store[]> {
    return this.db.client
      .select()
      .from(stores)
      .where(eq(stores.sellerId, sellerId));
  }

  async findById(id: string): Promise<Store | undefined> {
    const result = await this.db.client
      .select()
      .from(stores)
      .where(eq(stores.id, id))
      .limit(1);
    return result[0];
  }

  async updateStore(id: string, data: Partial<NewStore>): Promise<Store> {
    const result = await this.db.client
      .update(stores)
      .set(data)
      .where(eq(stores.id, id))
      .returning();
    return result[0];
  }

  async deleteStore(id: string): Promise<void> {
    await this.db.client
      .delete(stores)
      .where(eq(stores.id, id));
  }
}
