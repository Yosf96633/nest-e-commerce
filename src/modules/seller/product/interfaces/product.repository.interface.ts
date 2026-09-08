import { NewProduct, Product } from '@/infrastructure/database/schema';

export interface IProductRepository {
  createProduct(product: NewProduct): Promise<Product>;
  findById(id: string): Promise<Product | undefined>;
  findBySlug(slug: string): Promise<Product | undefined>;
  findByStoreId(storeId: string): Promise<Product[]>;
  updateProduct(id: string, data: Partial<NewProduct>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
}

export const IProductRepository = Symbol('IProductRepository');
