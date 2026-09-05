import { UpdateApplicationDto } from "@/modules/admin/dto/update-application.dto";
import { Application, NewApplication } from "../../../infrastructure/database/schema/application.schema"

export interface IApplicationRepository {
    createApplication(application: NewApplication): Promise<Application>;
    // getApplicationById(id: string): Promise<Application | null>;
    getAllApplications();
    approve_or_rejectApplication(id: string, data: UpdateApplicationDto): Promise<Application>;

    // deleteApplication(id: string): Promise<Application>;
}


export const APPLICATIONS_REPOSITORY = Symbol('IApplicationRepository');
