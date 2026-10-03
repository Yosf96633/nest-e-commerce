import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ReviewListOptions } from './entities/review.entity';
import { IReviewRepository } from './interfaces/review.repository.interface';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewsQueryDto } from './dto/reviews-query.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @Inject(IReviewRepository)
    private readonly reviewRepository: IReviewRepository,
  ) {}

  async listForProduct(productId: string, query: ReviewsQueryDto) {
    const product = await this.reviewRepository.findProduct(productId);
    if (!product) {
      throw new NotFoundException('Product not found', 'PRODUCT_NOT_FOUND');
    }

    const options = this.toListOptions(query);
    const result = await this.reviewRepository.findByProduct(
      productId,
      options,
    );

    return {
      data: result.data,
      summary: result.summary,
      pagination: this.toPagination(options, result.total),
    };
  }

  async listForUser(userId: string, query: ReviewsQueryDto) {
    const options = this.toListOptions(query);
    const result = await this.reviewRepository.findByUser(userId, options);

    return {
      data: result.data,
      pagination: this.toPagination(options, result.total),
    };
  }

  async create(productId: string, userId: string, dto: CreateReviewDto) {
    const product = await this.reviewRepository.findProduct(productId);
    if (!product?.isReviewable) {
      throw new NotFoundException(
        'Active product not found',
        'PRODUCT_NOT_FOUND',
      );
    }

    const created = await this.reviewRepository.create({
      productId,
      userId,
      rating: dto.rating,
      title: dto.title,
      comment: dto.comment,
    });

    if (!created) {
      throw new ConflictException(
        'You have already reviewed this product',
        'REVIEW_ALREADY_EXISTS',
      );
    }

    return created;
  }

  async update(reviewId: string, userId: string, dto: UpdateReviewDto) {
    if (
      dto.rating === undefined &&
      dto.title === undefined &&
      dto.comment === undefined
    ) {
      throw new BadRequestException(
        'At least one review field is required',
        'EMPTY_REVIEW_UPDATE',
      );
    }

    const updated = await this.reviewRepository.updateOwned(
      reviewId,
      userId,
      dto,
    );
    if (!updated) {
      throw new NotFoundException('Review not found', 'REVIEW_NOT_FOUND');
    }

    return updated;
  }

  async remove(reviewId: string, userId: string) {
    const deleted = await this.reviewRepository.deleteOwned(reviewId, userId);
    if (!deleted) {
      throw new NotFoundException('Review not found', 'REVIEW_NOT_FOUND');
    }

    return { message: 'Review deleted successfully' };
  }

  private toListOptions(query: ReviewsQueryDto): ReviewListOptions {
    return {
      page: query.page || 1,
      limit: query.limit || 20,
      rating: query.rating,
      sort: query.sort || 'newest',
    };
  }

  private toPagination(options: ReviewListOptions, total: number) {
    return {
      page: options.page,
      limit: options.limit,
      total,
      totalPages: Math.ceil(total / options.limit),
    };
  }
}
