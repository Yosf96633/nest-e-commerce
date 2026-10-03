import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { Review } from './entities/review.entity';
import type { IReviewRepository } from './interfaces/review.repository.interface';
import { ReviewsService } from './reviews.service';

describe('ReviewsService', () => {
  let repository: jest.Mocked<IReviewRepository>;
  let service: ReviewsService;

  const review: Review = {
    id: 'review-id',
    productId: 'product-id',
    userId: 'user-id',
    rating: 5,
    title: 'Excellent product',
    comment: 'The product works exactly as expected.',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    repository = {
      findProduct: jest.fn(),
      findByProduct: jest.fn(),
      findByUser: jest.fn(),
      create: jest.fn(),
      updateOwned: jest.fn(),
      deleteOwned: jest.fn(),
    };
    service = new ReviewsService(repository);
  });

  it('returns product reviews with pagination from the repository', async () => {
    repository.findProduct.mockResolvedValue({
      id: 'product-id',
      isReviewable: true,
    });
    repository.findByProduct.mockResolvedValue({
      data: [],
      total: 3,
      summary: {
        count: 3,
        averageRating: 4,
        distribution: { 1: 0, 2: 0, 3: 1, 4: 1, 5: 1 },
      },
    });

    const result = await service.listForProduct('product-id', {
      page: 2,
      limit: 2,
      sort: 'newest',
    });

    expect(repository.findByProduct).toHaveBeenCalledWith('product-id', {
      page: 2,
      limit: 2,
      rating: undefined,
      sort: 'newest',
    });
    expect(result.pagination).toEqual({
      page: 2,
      limit: 2,
      total: 3,
      totalPages: 2,
    });
  });

  it('rejects reviews for products that are not active', async () => {
    repository.findProduct.mockResolvedValue({
      id: 'product-id',
      isReviewable: false,
    });

    await expect(
      service.create('product-id', 'user-id', {
        rating: 5,
        title: 'Excellent product',
        comment: 'The product works exactly as expected.',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('returns a conflict when the repository detects a duplicate review', async () => {
    repository.findProduct.mockResolvedValue({
      id: 'product-id',
      isReviewable: true,
    });
    repository.create.mockResolvedValue(undefined);

    await expect(
      service.create('product-id', 'user-id', {
        rating: 5,
        title: 'Excellent product',
        comment: 'The product works exactly as expected.',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects an empty update before calling the repository', async () => {
    await expect(
      service.update('review-id', 'user-id', {}),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.updateOwned).not.toHaveBeenCalled();
  });

  it('returns an updated review owned by the current user', async () => {
    repository.updateOwned.mockResolvedValue(review);

    await expect(
      service.update('review-id', 'user-id', { rating: 5 }),
    ).resolves.toBe(review);
    expect(repository.updateOwned).toHaveBeenCalledWith(
      'review-id',
      'user-id',
      { rating: 5 },
    );
  });
});
