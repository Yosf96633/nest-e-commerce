import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import type { JwtPayload } from '@/common/types/jwt-payload.type';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewsQueryDto } from './dto/reviews-query.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewsService } from './reviews.service';

@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('products/:productId/reviews')
  listForProduct(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query() query: ReviewsQueryDto,
  ) {
    return this.reviewsService.listForProduct(productId, query);
  }

  @Post('products/:productId/reviews')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('productId', ParseUUIDPipe) productId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(productId, user.sub, dto);
  }

  @Get('reviews/me')
  @UseGuards(JwtAuthGuard)
  listForCurrentUser(
    @CurrentUser() user: JwtPayload,
    @Query() query: ReviewsQueryDto,
  ) {
    return this.reviewsService.listForUser(user.sub, query);
  }

  @Patch('reviews/:reviewId')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.update(reviewId, user.sub, dto);
  }

  @Delete('reviews/:reviewId')
  @UseGuards(JwtAuthGuard)
  remove(
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reviewsService.remove(reviewId, user.sub);
  }
}
