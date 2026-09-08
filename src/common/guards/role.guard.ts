import { CanActivate, ExecutionContext, Injectable, ForbiddenException, UnauthorizedException, Inject } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { ROLE_READER, type IRoleReader } from '../interfaces/role-reader.interface';
import { Role } from '../types/role.type';

@Injectable()
export class RoleGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        @Inject(ROLE_READER)
        private readonly roleReader: IRoleReader,
    ) { }

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
        const dbUserRoles = await this.roleReader.getRoles(userID);

        // 4. Check if the user has at least one role required by the route
        const hasPermission = dbUserRoles.some((role) => routeRoles.includes(role));

        // 5. Throw ForbiddenException if they lack the required role
        if (!hasPermission) {
            throw new ForbiddenException("You do not have permission to access this resource");
        }

        return true;
    }
}
