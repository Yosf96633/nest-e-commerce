import type { ProductImage } from '@/modules/seller/product/entities/product.entity';

export const REVIEW_SORT_OPTIONS = [
  'newest',
  'oldest',
  'highest',
  'lowest',
] as const;

export type ReviewSort = (typeof REVIEW_SORT_OPTIONS)[number];

export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReviewData {
  productId: string;
  userId: string;
  rating: number;
  title: string;
  comment: string;
}

export type UpdateReviewData = Partial<
  Pick<Review, 'rating' | 'title' | 'comment'>
>;

export interface ReviewListOptions {
  page: number;
  limit: number;
  rating?: number;
  sort: ReviewSort;
}

export interface ReviewAuthor {
  id: string;
  firstName: string;
  lastName: string;
  profileImage: string | null;
}

export interface ProductReview extends Omit<Review, 'productId' | 'userId'> {
  user: ReviewAuthor;
}

export interface ReviewedProduct {
  id: string;
  name: string;
  slug: string;
  images: ProductImage[];
}

export interface UserReview extends Review {
  product: ReviewedProduct;
}

export interface ReviewSummary {
  count: number;
  averageRating: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface ProductReviewsResult {
  data: ProductReview[];
  total: number;
  summary: ReviewSummary;
}

export interface UserReviewsResult {
  data: UserReview[];
  total: number;
}

export interface ReviewableProduct {
  id: string;
  isReviewable: boolean;
}
