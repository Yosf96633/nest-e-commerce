import type {
  CreateReviewData,
  ProductReviewsResult,
  Review,
  ReviewListOptions,
  ReviewableProduct,
  UpdateReviewData,
  UserReviewsResult,
} from '../entities/review.entity';

export interface IReviewRepository {
  findProduct(id: string): Promise<ReviewableProduct | undefined>;
  findByProduct(
    productId: string,
    options: ReviewListOptions,
  ): Promise<ProductReviewsResult>;
  findByUser(
    userId: string,
    options: ReviewListOptions,
  ): Promise<UserReviewsResult>;
  create(data: CreateReviewData): Promise<Review | undefined>;
  updateOwned(
    reviewId: string,
    userId: string,
    data: UpdateReviewData,
  ): Promise<Review | undefined>;
  deleteOwned(reviewId: string, userId: string): Promise<boolean>;
}

export const IReviewRepository = Symbol('IReviewRepository');
