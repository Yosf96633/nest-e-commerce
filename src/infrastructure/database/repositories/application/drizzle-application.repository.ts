import { IApplicationRepository } from "../../../../modules/application/interfaces/application-repository.interface";
import { Application, NewApplication, applications } from "../../../database/schema/application.schema";
import { DatabaseService } from "../../database.service";
import { Injectable } from "@nestjs/common";

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
}