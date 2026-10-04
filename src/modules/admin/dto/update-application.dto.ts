import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateApplicationDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  rejectionReason?: string;
}
