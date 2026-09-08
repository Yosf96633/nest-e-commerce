import { Injectable } from '@nestjs/common';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { DatabaseService } from '../../database.service';
import {
  users,
  userRoles,
  refreshTokens,
} from '../../schema';
import { IUsersRepository } from '../../../../modules/users/interfaces/users-repository.interface';
import {
  CreateUserData,
  User,
} from '../../../../modules/users/entities/user.entity';
import { RefreshToken } from '../../../../modules/users/entities/refresh-token.entity';
import { Role } from '@/common/types/role.type';

@Injectable()
export class DrizzleUsersRepository implements IUsersRepository {
  constructor(private readonly db: DatabaseService) { }

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


  async create(data: CreateUserData): Promise<User> {
    const result = await this.db.client.insert(users).values({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      passwordHash: data.passwordHash,
      profileImage: data.profileImage,
    }).returning();
    return this.toUser(result[0]);
  }

  async delete(userId: string): Promise<void> {
    await this.db.client
      .delete(users)
      .where(eq(users.id, userId));
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

  async storeRefreshToken(userId: string, refreshToken: string, expiresAt: Date): Promise<RefreshToken> {
    const result = await this.db.client.insert(refreshTokens).values({ userId, tokenHash: refreshToken, expiresAt }).returning()
    return this.toRefreshToken(result[0])
  }

  async findActiveRefreshTokensByUserId(userId: string): Promise<RefreshToken[]> {
    const result = await this.db.client
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.userId, userId),
          isNull(refreshTokens.revokedAt),
          gt(refreshTokens.expiresAt, new Date()),
        ),
      );
    return result.map((token) => this.toRefreshToken(token));
  }

  async revokeRefreshToken(tokenId: string, replacedByTokenId?: string): Promise<void> {
    await this.db.client
      .update(refreshTokens)
      .set({
        revokedAt: new Date(),
        replacedBy: replacedByTokenId ?? null,
      })
      .where(eq(refreshTokens.id, tokenId));
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
      isEmailVerified: record.isEmailVerified,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private toRefreshToken(
    record: typeof refreshTokens.$inferSelect,
  ): RefreshToken {
    return {
      id: record.id,
      userId: record.userId,
      tokenHash: record.tokenHash,
      expiresAt: record.expiresAt,
      createdAt: record.createdAt,
      revokedAt: record.revokedAt,
      replacedBy: record.replacedBy,
      userAgent: record.userAgent,
      ipAddress: record.ipAddress,
    };
  }
}
