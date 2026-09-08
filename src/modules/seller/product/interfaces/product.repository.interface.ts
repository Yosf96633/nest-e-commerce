import {
  CreateProductData,
  Product,
  UpdateProductData,
} from '../entities/product.entity';

export interface IProductRepository {
  createProduct(product: CreateProductData): Promise<Product>;
  findById(id: string): Promise<Product | undefined>;
  findBySlug(slug: string): Promise<Product | undefined>;
  findByStoreId(storeId: string): Promise<Product[]>;
  updateProduct(id: string, data: UpdateProductData): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
}

export const IProductRepository = Symbol('IProductRepository');
