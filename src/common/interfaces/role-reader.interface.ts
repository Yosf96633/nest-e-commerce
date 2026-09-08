import type { Role } from '../types/role.type';

export interface IRoleReader {
  getRoles(userId: string): Promise<Role[]>;
}

export const ROLE_READER = Symbol('IRoleReader');
