import { UpdateApplicationDto } from "@/modules/admin/dto/update-application.dto";
import { IApplicationRepository } from "../../../../modules/application/interfaces/application-repository.interface";
import { Application, NewApplication, applications } from "../../../database/schema/application.schema";
import { DatabaseService } from "../../database.service";
import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";

@Injectable()
export class DrizzleApplicationRepository implements IApplicationRepository {

    constructor(private readonly db: DatabaseService) { }

    async createApplication(application: NewApplication): Promise<Application> {
        const result = await this.db.client.insert(applications).values(application).returning();
        return result[0];
    }

    async getAllApplications() {
        return await this.db.client.query.applications.findMany({
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
        })

    }

    async approve_or_rejectApplication(id: string, data: UpdateApplicationDto): Promise<Application> {
        const res = await this.db.client.update(applications).set({
            status: data.status,
            rejectionReason: data.rejectionReason,
            reviewedBy: data.reviewedBy,
            reviewedAt: new Date(),
            updatedAt: new Date(),

        }).where(eq(applications.id, id)).returning();

        return res[0];
    }
}