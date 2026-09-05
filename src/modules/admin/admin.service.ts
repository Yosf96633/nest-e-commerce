import { Inject, Injectable } from '@nestjs/common';
import { APPLICATIONS_REPOSITORY, type IApplicationRepository } from '../application/interfaces/application-repository.interface';
import { Application, NewApplication } from "@/infrastructure/database/schema/application.schema"
@Injectable()
export class AdminService {

    constructor(
        @Inject(APPLICATIONS_REPOSITORY)
        private readonly applicationRepository: IApplicationRepository
    ) { }

    async viewAllApplication() {
        const applications = await this.applicationRepository.getAllApplications()
        return applications;
    }






}
