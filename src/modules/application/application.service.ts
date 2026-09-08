import { Injectable, Inject } from '@nestjs/common';
import { type IApplicationRepository, APPLICATIONS_REPOSITORY } from './interfaces/application-repository.interface';
import type {
    Application,
    CreateApplicationData,
} from './entities/application.entity';

@Injectable()
export class ApplicationService {

    constructor(
        @Inject(APPLICATIONS_REPOSITORY)
        private readonly applicationRepository: IApplicationRepository,
    ) { }

    async createApplication(application: CreateApplicationData): Promise<Application> {
        const newApplication = await this.applicationRepository.createApplication(application);
        return newApplication;
    }
}
