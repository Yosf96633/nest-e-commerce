import { IApplicationRepository } from "../../../../modules/application/interfaces/application-repository.interface";
import { applications } from "../../../database/schema/application.schema";
import {
    Application,
    ApplicationListItem,
    ApplicationStatus,
    CreateApplicationData,
    ReviewApplicationData,
} from '../../../../modules/application/entities/application.entity';
import { DatabaseService } from "../../database.service";
import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";

@Injectable()
export class DrizzleApplicationRepository implements IApplicationRepository {

    constructor(private readonly db: DatabaseService) { }

    async createApplication(application: CreateApplicationData): Promise<Application> {
        const result = await this.db.client.insert(applications).values({
            userId: application.userId,
            type: application.type,
        }).returning();
        return this.toEntity(result[0]);
    }

    async getAllApplications(status?: ApplicationStatus): Promise<ApplicationListItem[]> {
        const records = await this.db.client.query.applications.findMany({
            where: status ? eq(applications.status, status) : undefined,
            columns: {
                userId: false,
                updatedAt: false,
            },
            with: {
                user: {
                    columns: {
                        passwordHash: false,
                        updatedAt: false,
                    }
                }
            }
        });
        return records.map((record) => ({
            id: record.id,
            type: record.type,
            status: record.status,
            reviewedBy: record.reviewedBy,
            reviewedAt: record.reviewedAt,
            rejectionReason: record.rejectionReason,
            createdAt: record.createdAt,
            user: {
                id: record.user.id,
                firstName: record.user.firstName,
                lastName: record.user.lastName,
                email: record.user.email,
                phoneNumber: record.user.phoneNumber,
                profileImage: record.user.profileImage,
                isEmailVerified: record.user.isEmailVerified,
                createdAt: record.user.createdAt,
            },
        }));

    }

    async approve_or_rejectApplication(id: string, data: ReviewApplicationData): Promise<Application> {
        const res = await this.db.client.update(applications).set({
            status: data.status,
            rejectionReason: data.rejectionReason,
            reviewedBy: data.reviewedBy,
            reviewedAt: new Date(),
            updatedAt: new Date(),

        }).where(eq(applications.id, id)).returning();

        return this.toEntity(res[0]);
    }

    private toEntity(record: typeof applications.$inferSelect): Application {
        return {
            id: record.id,
            userId: record.userId,
            type: record.type,
            status: record.status,
            reviewedBy: record.reviewedBy,
            reviewedAt: record.reviewedAt,
            rejectionReason: record.rejectionReason,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
        };
    }
}
