import { CreateUserData, User } from '../entities/user.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { Role } from '@/common/types/role.type';

export interface IUsersRepository {
  findById(id: string): Promise<User | undefined>;
  findByEmail(email: string): Promise<User | undefined>;
  create(data: CreateUserData): Promise<User>;
  delete(userId: string): Promise<void>;
  markEmailVerified(userId: string): Promise<void>;
  getRoles(userId: string): Promise<Role[]>;
  assignRole(userId: string, role: Role): Promise<void>;
  storeRefreshToken(userId: string, refreshToken: string, expiresAt: Date): Promise<RefreshToken>;
  findActiveRefreshTokensByUserId(userId: string): Promise<RefreshToken[]>;
  revokeRefreshToken(tokenId: string, replacedByTokenId?: string): Promise<void>;
}

export const USERS_REPOSITORY = Symbol('IUsersRepository');
