import { DatabaseService } from "@/infrastructure/database/database.service";
import { Role, userRoles } from "@/infrastructure/database/schema";
import { CanActivate, ExecutionContext, Injectable, ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { eq } from "drizzle-orm";
import type { Request } from "express";

@Injectable()
export class RoleGuard implements CanActivate {
    constructor(private readonly reflector: Reflector, private readonly db: DatabaseService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {

        const request = context.switchToHttp().getRequest<Request>();
        const userID = request.user?.sub;

        if (!userID) {
            throw new UnauthorizedException("Unauthorized user!");
        }

        // 1. Get the allowed roles for this route
        const routeRoles = this.reflector.get<Role[]>(
            'roles',
            context.getHandler()
        );

        // If the route has no specific role requirements, let them pass
        if (!routeRoles || routeRoles.length === 0) {
            return true;
        }

        // 2. Fetch the user's roles from the database
        const rolesResult = await this.db.client
            .select({ role: userRoles.role })
            .from(userRoles)
            .where(eq(userRoles.userId, userID));

        // 3. Flatten the database rows into a primitive array: Role[]
        const dbUserRoles = rolesResult.map(row => row.role);

        // 4. Check if the user has at least one role required by the route
        const hasPermission = dbUserRoles.some((role) => routeRoles.includes(role));

        // 5. Throw ForbiddenException if they lack the required role
        if (!hasPermission) {
            throw new ForbiddenException("You do not have permission to access this resource");
        }

        return true;
    }
}
