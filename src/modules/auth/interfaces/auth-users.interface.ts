import { AuthUser, CreateAuthUserData } from '../entities/auth-user.entity';
import { AuthRefreshToken } from '../entities/refresh-token.entity';
import {
  AuthSession,
  CreateAuthSessionData,
} from '@/modules/users/entities/auth-session.entity';
import { AuthRole } from '../types/role.type';

export interface IAuthUsers {
  findById(id: string): Promise<AuthUser | undefined>;
  findByEmail(email: string): Promise<AuthUser | undefined>;
  create(data: CreateAuthUserData): Promise<AuthUser>;
  delete(userId: string): Promise<void>;
  markEmailVerified(userId: string): Promise<void>;
  getRoles(userId: string): Promise<AuthRole[]>;
  assignRole(userId: string, role: AuthRole): Promise<void>;
  createSessionWithRefreshToken(
    session: CreateAuthSessionData,
    token: { id: string; tokenHash: string; expiresAt: Date },
  ): Promise<void>;
  findRefreshTokenById(
    userId: string,
    tokenId: string,
  ): Promise<AuthRefreshToken | undefined>;
  rotateRefreshToken(
    userId: string,
    sessionId: string,
    currentTokenId: string,
    newToken: { id: string; tokenHash: string; expiresAt: Date },
  ): Promise<boolean>;
  findActiveSessionsByUserId(userId: string): Promise<AuthSession[]>;
  revokeSessionById(userId: string, sessionId: string): Promise<boolean>;
  revokeAllSessions(userId: string): Promise<number>;
}

export const AUTH_USERS = Symbol('IAuthUsers');
