export const PRODUCT_STATUSES = ['draft', 'active', 'inactive'] as const;

export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export interface ProductImage {
  url: string;
  publicId: string;
  displayOrder: number;
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  stock: number;
  images: ProductImage[];
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductData {
  storeId: string;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  stock: number;
  images: ProductImage[];
  status: ProductStatus;
}

export interface UpdateProductData {
  name?: string;
  slug?: string;
  description?: string | null;
  price?: string;
  stock?: number;
  images?: ProductImage[];
  status?: ProductStatus;
  updatedAt?: Date;
}
