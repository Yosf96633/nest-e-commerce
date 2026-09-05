import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import {
    applicationStatusEnum,
    type ApplicationStatus,
} from '@/infrastructure/database/schema/application.schema';

export class UpdateApplicationDto {
    @IsOptional()
    @IsEnum(applicationStatusEnum.enumValues, {
        message: `status must be one of: ${applicationStatusEnum.enumValues.join(', ')}`,
    })
    status?: ApplicationStatus;

    @IsOptional()
    @IsUUID('all', { message: 'reviewedBy must be a valid UUID' })
    reviewedBy?: string;

    @IsOptional()
    @IsString()
    rejectionReason?: string;
}

