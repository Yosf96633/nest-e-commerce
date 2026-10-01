import { IsEnum, IsOptional } from 'class-validator';
import {
  APPLICATION_STATUSES,
  type ApplicationStatus,
} from '@/modules/application/entities/application.entity';

export class GetApplicationsQueryDto {
  @IsOptional()
  @IsEnum(APPLICATION_STATUSES, {
    message: `status must be one of: ${APPLICATION_STATUSES.join(', ')}`,
  })
  status?: ApplicationStatus;
}
