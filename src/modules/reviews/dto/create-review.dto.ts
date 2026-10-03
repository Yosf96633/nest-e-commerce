import {
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  comment: string;
}
