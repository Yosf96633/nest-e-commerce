import { AuthUser, CreateAuthUserData } from '../entities/auth-user.entity';
import { AuthRefreshToken } from '../entities/refresh-token.entity';
import { AuthRole } from '../types/role.type';

export interface IAuthUsers {
  findById(id: string): Promise<AuthUser | undefined>;
  findByEmail(email: string): Promise<AuthUser | undefined>;
  create(data: CreateAuthUserData): Promise<AuthUser>;
  delete(userId: string): Promise<void>;
  markEmailVerified(userId: string): Promise<void>;
  getRoles(userId: string): Promise<AuthRole[]>;
  assignRole(userId: string, role: AuthRole): Promise<void>;
  storeRefreshToken(
    userId: string,
    refreshToken: string,
    expiresAt: Date,
    metadata?: { userAgent?: string; ipAddress?: string },
  ): Promise<AuthRefreshToken>;
  findActiveRefreshTokensByUserId(userId: string): Promise<AuthRefreshToken[]>;
  revokeRefreshToken(
    userId: string,
    tokenId: string,
    replacedByTokenId?: string,
  ): Promise<boolean>;
  revokeAllRefreshTokens(userId: string): Promise<number>;
}

export const AUTH_USERS = Symbol('IAuthUsers');
