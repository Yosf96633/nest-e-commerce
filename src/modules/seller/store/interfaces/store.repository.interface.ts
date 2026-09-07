import { NewStore, Store } from '@/infrastructure/database/schema';

export interface IStoreRepository {
  createStore(store: NewStore): Promise<Store>;
  findBySlug(slug: string): Promise<Store | undefined>;
  findBySellerId(sellerId: string): Promise<Store[]>;
  findById(id: string): Promise<Store | undefined>;
  updateStore(id: string, data: Partial<NewStore>): Promise<Store>;
  deleteStore(id: string): Promise<void>;
}

export const IStoreRepository = Symbol('IStoreRepository');