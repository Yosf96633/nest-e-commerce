import {
  CreateStoreData,
  Store,
  UpdateStoreData,
} from '../entities/store.entity';

export interface IStoreRepository {
  createStore(store: CreateStoreData): Promise<Store>;
  findBySlug(slug: string): Promise<Store | undefined>;
  findBySellerId(sellerId: string): Promise<Store[]>;
  findById(id: string): Promise<Store | undefined>;
  updateStore(id: string, data: UpdateStoreData): Promise<Store>;
  deleteStore(id: string): Promise<void>;
}

export const IStoreRepository = Symbol('IStoreRepository');
