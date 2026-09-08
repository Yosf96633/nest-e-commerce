import { Injectable } from '@nestjs/common';
import { emailVerificationTokens } from 'src/infrastructure/database/schema';
import { IEmailVerificationTokenRepository } from '../../../../modules/auth/interfaces/email-verification-tokens-repositry.interface';
import {
  CreateEmailVerificationTokenData,
  EmailVerificationToken,
} from '../../../../modules/auth/entities/email-verification-token.entity';
import { DatabaseService } from 'src/infrastructure/database/database.service';
import { eq } from 'drizzle-orm';


@Injectable()
export class DrizzleEmailVeriRepository implements IEmailVerificationTokenRepository {
  constructor(private readonly db: DatabaseService) { }

  async create(
    data: CreateEmailVerificationTokenData,
  ): Promise<EmailVerificationToken | undefined> {
    const newData = await this.db.client
      .insert(emailVerificationTokens)
      .values({
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
      })
      .returning();
    return newData[0] ? this.toEntity(newData[0]) : undefined;
  }

  async findValidToken(userId: string): Promise<EmailVerificationToken | undefined> {
    const data = await this.db.client
      .select()
      .from(emailVerificationTokens)
      .where(eq(emailVerificationTokens.userId, userId));
    return data[0] ? this.toEntity(data[0]) : undefined;
  }

  async delete(id: string): Promise<void> {
    await this.db.client.delete(emailVerificationTokens).where(eq(emailVerificationTokens.id, id))
  }

  private toEntity(
    record: typeof emailVerificationTokens.$inferSelect,
  ): EmailVerificationToken {
    return {
      id: record.id,
      userId: record.userId,
      tokenHash: record.tokenHash,
      expiresAt: record.expiresAt,
      consumedAt: record.consumedAt,
      createdAt: record.createdAt,
    };
  }
}
