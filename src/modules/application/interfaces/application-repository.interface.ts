import {
    Application,
    ApplicationListItem,
    ApplicationStatus,
    CreateApplicationData,
    ReviewApplicationData,
} from '../entities/application.entity';

export interface IApplicationRepository {
    createApplication(application: CreateApplicationData): Promise<Application>;
    // getApplicationById(id: string): Promise<Application | null>;
    getAllApplications(status?: ApplicationStatus): Promise<ApplicationListItem[]>;
    approve_or_rejectApplication(id: string, data: ReviewApplicationData): Promise<Application>;

    // deleteApplication(id: string): Promise<Application>;
}


export const APPLICATIONS_REPOSITORY = Symbol('IApplicationRepository');
