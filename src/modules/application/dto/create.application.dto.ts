import { IsEnum } from 'class-validator';
import { APPLICATION_TYPES } from '../entities/application.entity';
import type { ApplicationType } from '../entities/application.entity';

export class CreateApplicationDto {
    /**
     * The type of application the user is submitting.
     * Must be one of the allowed enum values: 'seller' | 'rider'
     */
    @IsEnum(APPLICATION_TYPES, {
        message: `type must be one of: ${APPLICATION_TYPES.join(', ')}`,
    })
    type!: ApplicationType;
}
