import { IsEnum } from 'class-validator';
import { applicationTypeEnum } from '@/infrastructure/database/schema/application.schema';

export type ApplicationType = (typeof applicationTypeEnum.enumValues)[number];

export class CreateApplicationDto {
    /**
     * The type of application the user is submitting.
     * Must be one of the allowed enum values: 'seller' | 'rider'
     */
    @IsEnum(applicationTypeEnum.enumValues, {
        message: `type must be one of: ${applicationTypeEnum.enumValues.join(', ')}`,
    })
    type: ApplicationType;
}
