import type { Product } from '@/modules/seller/product/entities/product.entity';

export interface CartStore {
  id: string;
  name: string;
  slug: string;
}

export interface CartProduct extends Product {
  store: CartStore;
}

export interface CartItemRecord {
  product: Product;
  store: CartStore;
  quantity: number;
}

export interface CartItem {
  product: CartProduct;
  quantity: number;
  lineTotal: string;
}

export interface Cart {
  items: CartItem[];
  itemCount: number;
  subtotal: string;
}

export interface PurchasableProduct {
  id: string;
  stock: number;
}
