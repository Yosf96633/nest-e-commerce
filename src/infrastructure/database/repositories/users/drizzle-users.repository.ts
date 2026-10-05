import { Injectable } from '@nestjs/common';
import { and, eq, gt, inArray, isNull } from 'drizzle-orm';
import { DatabaseService } from '../../database.service';
import {
  users,
  userRoles,
  refreshTokens,
  authSessions,
  stores,
  products,
} from '../../schema';
import { IUsersRepository } from '../../../../modules/users/interfaces/users-repository.interface';
import {
  CreateUserData,
  UpdateUserData,
  User,
  UserWithRoles,
} from '../../../../modules/users/entities/user.entity';
import { RefreshToken } from '../../../../modules/users/entities/refresh-token.entity';
import {
  AuthSession,
  CreateAuthSessionData,
} from '../../../../modules/users/entities/auth-session.entity';
import { Role } from '@/common/types/role.type';

@Injectable()
export class DrizzleUsersRepository implements IUsersRepository {
  constructor(private readonly db: DatabaseService) {}

  async findById(id: string): Promise<User | undefined> {
    const result = await this.db.client
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return result[0] ? this.toUser(result[0]) : undefined;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.client
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return result[0] ? this.toUser(result[0]) : undefined;
  }

  async findByIdWithRoles(id: string): Promise<UserWithRoles | undefined> {
    const user = await this.findById(id);
    if (!user) {
      return undefined;
    }

    const roles = await this.getRoles(id);
    return this.toUserWithRoles(user, roles);
  }

  async findAllWithRoles(): Promise<UserWithRoles[]> {
    const [userRecords, roleRecords] = await Promise.all([
      this.db.client.select().from(users),
      this.db.client
        .select({ userId: userRoles.userId, role: userRoles.role })
        .from(userRoles),
    ]);

    const rolesByUser = new Map<string, Role[]>();
    for (const record of roleRecords) {
      const roles = rolesByUser.get(record.userId) ?? [];
      roles.push(record.role);
      rolesByUser.set(record.userId, roles);
    }

    return userRecords.map((record) => {
      const user = this.toUser(record);
      return this.toUserWithRoles(user, rolesByUser.get(user.id) ?? []);
    });
  }

  async create(data: CreateUserData): Promise<User> {
    const result = await this.db.client
      .insert(users)
      .values({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        passwordHash: data.passwordHash,
        profileImage: data.profileImage,
        profileImagePublicId: data.profileImagePublicId,
      })
      .returning();
    return this.toUser(result[0]);
  }

  async update(userId: string, data: UpdateUserData): Promise<User> {
    const result = await this.db.client
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return this.toUser(result[0]);
  }

  async delete(userId: string): Promise<void> {
    await this.db.client.delete(users).where(eq(users.id, userId));
  }

  async findCloudinaryPublicIdsForUser(userId: string): Promise<string[]> {
    const [userRecords, ownedStores] = await Promise.all([
      this.db.client
        .select({ publicId: users.profileImagePublicId })
        .from(users)
        .where(eq(users.id, userId)),
      this.db.client
        .select({
          id: stores.id,
          profileImagePublicId: stores.profileImagePublicId,
          coverImagePublicId: stores.coverImagePublicId,
        })
        .from(stores)
        .where(eq(stores.sellerId, userId)),
    ]);

    const storeIds = ownedStores.map((store) => store.id);
    const ownedProducts = storeIds.length
      ? await this.db.client
          .select({ images: products.images })
          .from(products)
          .where(inArray(products.storeId, storeIds))
      : [];

    return [
      userRecords[0]?.publicId,
      ...ownedStores.flatMap((store) => [
        store.profileImagePublicId,
        store.coverImagePublicId,
      ]),
      ...ownedProducts.flatMap((product) =>
        product.images.map((image) => image.publicId),
      ),
    ].filter((publicId): publicId is string => Boolean(publicId));
  }

  async markEmailVerified(userId: string): Promise<void> {
    await this.db.client
      .update(users)
      .set({ isEmailVerified: true, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async getRoles(userId: string): Promise<Role[]> {
    const result = await this.db.client
      .select({ role: userRoles.role })
      .from(userRoles)
      .where(eq(userRoles.userId, userId));
    return result.map((r) => r.role);
  }

  async assignRole(userId: string, role: Role): Promise<void> {
    await this.db.client
      .insert(userRoles)
      .values({ userId, role })
      .onConflictDoNothing();
  }

  async createSessionWithRefreshToken(
    session: CreateAuthSessionData,
    token: { id: string; tokenHash: string; expiresAt: Date },
  ): Promise<void> {
    await this.db.client.transaction(async (tx) => {
      await tx.insert(authSessions).values(session);
      await tx.insert(refreshTokens).values({
        id: token.id,
        userId: session.userId,
        sessionId: session.id,
        tokenHash: token.tokenHash,
        expiresAt: token.expiresAt,
      });
    });
  }

  async findRefreshTokenById(
    userId: string,
    tokenId: string,
  ): Promise<RefreshToken | undefined> {
    const result = await this.db.client
      .select()
      .from(refreshTokens)
      .where(
        and(eq(refreshTokens.id, tokenId), eq(refreshTokens.userId, userId)),
      )
      .limit(1);
    return result[0] ? this.toRefreshToken(result[0]) : undefined;
  }

  async rotateRefreshToken(
    userId: string,
    sessionId: string,
    currentTokenId: string,
    newToken: { id: string; tokenHash: string; expiresAt: Date },
  ): Promise<boolean> {
    return this.db.client.transaction(async (tx) => {
      const activeSession = await tx
        .update(authSessions)
        .set({ expiresAt: newToken.expiresAt })
        .where(
          and(
            eq(authSessions.id, sessionId),
            eq(authSessions.userId, userId),
            isNull(authSessions.revokedAt),
            gt(authSessions.expiresAt, new Date()),
          ),
        )
        .returning({ id: authSessions.id });

      if (!activeSession.length) {
        return false;
      }

      const revoked = await tx
        .update(refreshTokens)
        .set({ revokedAt: new Date(), replacedBy: newToken.id })
        .where(
          and(
            eq(refreshTokens.id, currentTokenId),
            eq(refreshTokens.userId, userId),
            eq(refreshTokens.sessionId, sessionId),
            isNull(refreshTokens.revokedAt),
            gt(refreshTokens.expiresAt, new Date()),
          ),
        )
        .returning({ id: refreshTokens.id });

      if (!revoked.length) {
        return false;
      }

      await tx.insert(refreshTokens).values({
        id: newToken.id,
        userId,
        sessionId,
        tokenHash: newToken.tokenHash,
        expiresAt: newToken.expiresAt,
      });
      return true;
    });
  }

  async findActiveSessionsByUserId(userId: string): Promise<AuthSession[]> {
    const result = await this.db.client
      .select()
      .from(authSessions)
      .where(
        and(
          eq(authSessions.userId, userId),
          isNull(authSessions.revokedAt),
          gt(authSessions.expiresAt, new Date()),
        ),
      );
    return result.map((session) => this.toAuthSession(session));
  }

  async revokeSession(userId: string, sessionId: string): Promise<boolean> {
    return this.db.client.transaction(async (tx) => {
      const result = await tx
        .update(authSessions)
        .set({ revokedAt: new Date() })
        .where(
          and(
            eq(authSessions.id, sessionId),
            eq(authSessions.userId, userId),
            isNull(authSessions.revokedAt),
          ),
        )
        .returning({ id: authSessions.id });

      await tx
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(
          and(
            eq(refreshTokens.sessionId, sessionId),
            eq(refreshTokens.userId, userId),
            isNull(refreshTokens.revokedAt),
          ),
        );
      return result.length > 0;
    });
  }

  async revokeAllSessions(userId: string): Promise<number> {
    return this.db.client.transaction(async (tx) => {
      const result = await tx
        .update(authSessions)
        .set({ revokedAt: new Date() })
        .where(
          and(eq(authSessions.userId, userId), isNull(authSessions.revokedAt)),
        )
        .returning({ id: authSessions.id });

      await tx
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(
          and(
            eq(refreshTokens.userId, userId),
            isNull(refreshTokens.revokedAt),
          ),
        );
      return result.length;
    });
  }

  private toUser(record: typeof users.$inferSelect): User {
    return {
      id: record.id,
      firstName: record.firstName,
      lastName: record.lastName,
      email: record.email,
      phoneNumber: record.phoneNumber,
      passwordHash: record.passwordHash,
      profileImage: record.profileImage,
      profileImagePublicId: record.profileImagePublicId,
      isEmailVerified: record.isEmailVerified,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private toUserWithRoles(user: User, roles: Role[]): UserWithRoles {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      profileImage: user.profileImage,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles,
    };
  }

  private toRefreshToken(
    record: typeof refreshTokens.$inferSelect,
  ): RefreshToken {
    return {
      id: record.id,
      userId: record.userId,
      sessionId: record.sessionId,
      tokenHash: record.tokenHash,
      expiresAt: record.expiresAt,
      createdAt: record.createdAt,
      revokedAt: record.revokedAt,
      replacedBy: record.replacedBy,
    };
  }

  private toAuthSession(record: typeof authSessions.$inferSelect): AuthSession {
    return {
      id: record.id,
      userId: record.userId,
      expiresAt: record.expiresAt,
      createdAt: record.createdAt,
      revokedAt: record.revokedAt,
      userAgent: record.userAgent,
      ipAddress: record.ipAddress,
    };
  }
}
