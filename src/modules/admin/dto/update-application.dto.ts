import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import {
    APPLICATION_STATUSES,
    type ApplicationStatus,
} from '@/modules/application/entities/application.entity';

export class UpdateApplicationDto {
    @IsOptional()
    @IsEnum(APPLICATION_STATUSES, {
        message: `status must be one of: ${APPLICATION_STATUSES.join(', ')}`,
    })
    status?: ApplicationStatus;

    @IsOptional()
    @IsUUID('all', { message: 'reviewedBy must be a valid UUID' })
    reviewedBy?: string;

    @IsOptional()
    @IsString()
    rejectionReason?: string;
}
