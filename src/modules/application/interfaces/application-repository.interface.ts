import { Application, NewApplication } from "../../../infrastructure/database/schema/application.schema"

export interface IApplicationRepository {
    createApplication(application: NewApplication): Promise<Application>;
    // getApplicationById(id: string): Promise<Application | null>;
    getAllApplications();
    // updateApplication(id: string, application: Application): Promise<Application>;
    // deleteApplication(id: string): Promise<Application>;
}


export const APPLICATIONS_REPOSITORY = Symbol('IApplicationRepository');
