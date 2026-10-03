import type {
  CatalogListOptions,
  CatalogProduct,
  CatalogProductsResult,
} from '../entities/catalog.entity';

export interface ICatalogRepository {
  findActive(options: CatalogListOptions): Promise<CatalogProductsResult>;
  findActiveById(id: string): Promise<CatalogProduct | undefined>;
  findActiveBySlug(slug: string): Promise<CatalogProduct | undefined>;
}

export const ICatalogRepository = Symbol('ICatalogRepository');
