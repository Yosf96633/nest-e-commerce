import {
  CreateUserData,
  UpdateUserData,
  User,
  UserWithRoles,
} from '../entities/user.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import {
  AuthSession,
  CreateAuthSessionData,
} from '../entities/auth-session.entity';
import { Role } from '@/common/types/role.type';

export interface IUsersRepository {
  findById(id: string): Promise<User | undefined>;
  findByEmail(email: string): Promise<User | undefined>;
  findByIdWithRoles(id: string): Promise<UserWithRoles | undefined>;
  findAllWithRoles(): Promise<UserWithRoles[]>;
  create(data: CreateUserData): Promise<User>;
  update(userId: string, data: UpdateUserData): Promise<User>;
  delete(userId: string): Promise<void>;
  findCloudinaryPublicIdsForUser(userId: string): Promise<string[]>;
  markEmailVerified(userId: string): Promise<void>;
  getRoles(userId: string): Promise<Role[]>;
  assignRole(userId: string, role: Role): Promise<void>;
  createSessionWithRefreshToken(
    session: CreateAuthSessionData,
    token: {
      id: string;
      tokenHash: string;
      expiresAt: Date;
    },
  ): Promise<void>;
  findRefreshTokenById(
    userId: string,
    tokenId: string,
  ): Promise<RefreshToken | undefined>;
  rotateRefreshToken(
    userId: string,
    sessionId: string,
    currentTokenId: string,
    newToken: {
      id: string;
      tokenHash: string;
      expiresAt: Date;
    },
  ): Promise<boolean>;
  findActiveSessionsByUserId(userId: string): Promise<AuthSession[]>;
  revokeSession(userId: string, sessionId: string): Promise<boolean>;
  revokeAllSessions(userId: string): Promise<number>;
}

export const USERS_REPOSITORY = Symbol('IUsersRepository');
