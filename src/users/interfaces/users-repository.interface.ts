import { User, NewUser } from '../../database/schema';
import { Role } from '../../database/schema/user-roles.schema';

export interface IUsersRepository {
  findById(id: string): Promise<User | undefined>;
  findByEmail(email: string): Promise<User | undefined>;
  create(data: NewUser): Promise<User>;
  markEmailVerified(userId: string): Promise<void>;
  getRoles(userId: string): Promise<Role[]>;
  assignRole(userId: string, role: Role): Promise<void>;
}

export const USERS_REPOSITORY = Symbol('IUsersRepository');
