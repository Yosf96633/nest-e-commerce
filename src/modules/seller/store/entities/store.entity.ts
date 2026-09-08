export const STORE_STATUSES = ['active', 'inactive', 'suspended'] as const;

export type StoreStatus = (typeof STORE_STATUSES)[number];

export interface Store {
  id: string;
  sellerId: string;
  name: string;
  slug: string;
  description: string | null;
  profileImageUrl: string | null;
  profileImagePublicId: string | null;
  coverImageUrl: string | null;
  coverImagePublicId: string | null;
  status: StoreStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStoreData {
  sellerId: string;
  name: string;
  slug: string;
  description: string | null;
  profileImageUrl: string | null;
  profileImagePublicId: string | null;
  coverImageUrl: string | null;
  coverImagePublicId: string | null;
}

export interface UpdateStoreData {
  name?: string;
  slug?: string;
  description?: string | null;
  profileImageUrl?: string | null;
  profileImagePublicId?: string | null;
  coverImageUrl?: string | null;
  coverImagePublicId?: string | null;
  status?: StoreStatus;
  updatedAt?: Date;
}
