import type { Product } from '@/modules/seller/product/entities/product.entity';

export const CATALOG_SORT_FIELDS = ['createdAt', 'price', 'name'] as const;
export const CATALOG_SORT_ORDERS = ['asc', 'desc'] as const;

export type CatalogSortField = (typeof CATALOG_SORT_FIELDS)[number];
export type CatalogSortOrder = (typeof CATALOG_SORT_ORDERS)[number];

export interface CatalogStore {
  id: string;
  name: string;
  slug: string;
}

export interface CatalogProduct extends Product {
  store: CatalogStore;
}

export interface CatalogListOptions {
  page: number;
  limit: number;
  query?: string;
  minPrice?: number;
  maxPrice?: number;
  storeSlug?: string;
  sortBy: CatalogSortField;
  order: CatalogSortOrder;
}

export interface CatalogProductsResult {
  data: CatalogProduct[];
  total: number;
}
