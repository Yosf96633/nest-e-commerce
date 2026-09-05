import { Role } from '@/infrastructure/database/schema';
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: Role[]) =>
    SetMetadata('roles', roles);