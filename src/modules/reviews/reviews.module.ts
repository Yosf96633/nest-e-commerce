import { Module } from '@nestjs/common';
import { AuthModule } from '@/modules/auth/auth.module';
import { DrizzleReviewRepository } from '@/infrastructure/database/repositories/review/drizzle-review.repository';
import { IReviewRepository } from './interfaces/review.repository.interface';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [AuthModule],
  controllers: [ReviewsController],
  providers: [
    ReviewsService,
    {
      provide: IReviewRepository,
      useClass: DrizzleReviewRepository,
    },
  ],
})
export class ReviewsModule {}
