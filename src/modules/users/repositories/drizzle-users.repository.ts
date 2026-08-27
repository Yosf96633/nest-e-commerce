import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DatabaseService } from '../../../infrastructure/database/database.service';
import {
  users,
  userRoles,
  User,
  NewUser,
  refreshTokens,
  RefreshToken,
} from '../../../infrastructure/database/schema';
import { Role } from '../../../infrastructure/database/schema/user-roles.schema';
import { IUsersRepository } from '../interfaces/users-repository.interface';

@Injectable()
export class DrizzleUsersRepository implements IUsersRepository {
  constructor(private readonly db: DatabaseService) { }

  async findById(id: string): Promise<User | undefined> {
    const result = await this.db.client
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return result[0];
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.client
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return result[0];
  }


  async create(data: NewUser): Promise<User> {
    const result = await this.db.client
      .insert(users)
      .values(data)
      .returning();
    return result[0];
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
    return result[0]
  }
}
