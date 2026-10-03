import { Injectable } from '@nestjs/common';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import type {
  CreateReviewData,
  ProductReviewsResult,
  Review,
  ReviewListOptions,
  ReviewSummary,
  UpdateReviewData,
  UserReview,
  UserReviewsResult,
} from '@/modules/reviews/entities/review.entity';
import { IReviewRepository } from '@/modules/reviews/interfaces/review.repository.interface';
import { DatabaseService } from '../../database.service';
import { products, reviews, stores, users } from '../../schema';

@Injectable()
export class DrizzleReviewRepository implements IReviewRepository {
  constructor(private readonly db: DatabaseService) {}

  async findProduct(id: string) {
    const [record] = await this.db.client
      .select({
        id: products.id,
        productStatus: products.status,
        storeStatus: stores.status,
      })
      .from(products)
      .innerJoin(stores, eq(products.storeId, stores.id))
      .where(eq(products.id, id))
      .limit(1);

    if (!record) return undefined;

    return {
      id: record.id,
      isReviewable:
        record.productStatus === 'active' && record.storeStatus === 'active',
    };
  }

  async findByProduct(
    productId: string,
    options: ReviewListOptions,
  ): Promise<ProductReviewsResult> {
    const where = options.rating
      ? and(
          eq(reviews.productId, productId),
          eq(reviews.rating, options.rating),
        )
      : eq(reviews.productId, productId);

    const [rows, [filteredCount], [summary]] = await Promise.all([
      this.db.client
        .select({
          id: reviews.id,
          rating: reviews.rating,
          title: reviews.title,
          comment: reviews.comment,
          createdAt: reviews.createdAt,
          updatedAt: reviews.updatedAt,
          user: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImage: users.profileImage,
          },
        })
        .from(reviews)
        .innerJoin(users, eq(reviews.userId, users.id))
        .where(where)
        .orderBy(this.orderBy(options), desc(reviews.createdAt))
        .limit(options.limit)
        .offset((options.page - 1) * options.limit),
      this.db.client
        .select({ count: sql<number>`count(*)::int` })
        .from(reviews)
        .where(where),
      this.db.client
        .select({
          count: sql<number>`count(*)::int`,
          averageRating: sql<number>`coalesce(avg(${reviews.rating}), 0)::float8`,
          fiveStar: sql<number>`count(*) filter (where ${reviews.rating} = 5)::int`,
          fourStar: sql<number>`count(*) filter (where ${reviews.rating} = 4)::int`,
          threeStar: sql<number>`count(*) filter (where ${reviews.rating} = 3)::int`,
          twoStar: sql<number>`count(*) filter (where ${reviews.rating} = 2)::int`,
          oneStar: sql<number>`count(*) filter (where ${reviews.rating} = 1)::int`,
        })
        .from(reviews)
        .where(eq(reviews.productId, productId)),
    ]);

    return {
      data: rows,
      total: filteredCount.count,
      summary: this.toSummary(summary),
    };
  }

  async findByUser(
    userId: string,
    options: ReviewListOptions,
  ): Promise<UserReviewsResult> {
    const where = options.rating
      ? and(eq(reviews.userId, userId), eq(reviews.rating, options.rating))
      : eq(reviews.userId, userId);

    const [rows, [count]] = await Promise.all([
      this.db.client
        .select({
          review: reviews,
          product: {
            id: products.id,
            name: products.name,
            slug: products.slug,
            images: products.images,
          },
        })
        .from(reviews)
        .innerJoin(products, eq(reviews.productId, products.id))
        .where(where)
        .orderBy(this.orderBy(options), desc(reviews.createdAt))
        .limit(options.limit)
        .offset((options.page - 1) * options.limit),
      this.db.client
        .select({ count: sql<number>`count(*)::int` })
        .from(reviews)
        .where(where),
    ]);

    return {
      data: rows.map(({ review, product }): UserReview => ({
        ...review,
        product,
      })),
      total: count.count,
    };
  }

  async create(data: CreateReviewData): Promise<Review | undefined> {
    const [created] = await this.db.client
      .insert(reviews)
      .values(data)
      .onConflictDoNothing({ target: [reviews.productId, reviews.userId] })
      .returning();

    return created ? this.toEntity(created) : undefined;
  }

  async updateOwned(
    reviewId: string,
    userId: string,
    data: UpdateReviewData,
  ): Promise<Review | undefined> {
    const [updated] = await this.db.client
      .update(reviews)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(reviews.id, reviewId), eq(reviews.userId, userId)))
      .returning();

    return updated ? this.toEntity(updated) : undefined;
  }

  async deleteOwned(reviewId: string, userId: string): Promise<boolean> {
    const deleted = await this.db.client
      .delete(reviews)
      .where(and(eq(reviews.id, reviewId), eq(reviews.userId, userId)))
      .returning({ id: reviews.id });

    return deleted.length > 0;
  }

  private orderBy(options: ReviewListOptions) {
    return {
      newest: desc(reviews.createdAt),
      oldest: asc(reviews.createdAt),
      highest: desc(reviews.rating),
      lowest: asc(reviews.rating),
    }[options.sort];
  }

  private toSummary(record: {
    count: number;
    averageRating: number;
    fiveStar: number;
    fourStar: number;
    threeStar: number;
    twoStar: number;
    oneStar: number;
  }): ReviewSummary {
    return {
      count: record.count,
      averageRating: record.averageRating,
      distribution: {
        5: record.fiveStar,
        4: record.fourStar,
        3: record.threeStar,
        2: record.twoStar,
        1: record.oneStar,
      },
    };
  }

  private toEntity(record: typeof reviews.$inferSelect): Review {
    return {
      id: record.id,
      productId: record.productId,
      userId: record.userId,
      rating: record.rating,
      title: record.title,
      comment: record.comment,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
