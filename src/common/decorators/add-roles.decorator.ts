import { Role } from '@/common/types/role.type';
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: Role[]) =>
    SetMetadata('roles', roles);
