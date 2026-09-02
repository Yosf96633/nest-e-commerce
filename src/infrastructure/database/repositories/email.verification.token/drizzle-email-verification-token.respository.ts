import { Injectable } from '@nestjs/common';
import {
  NewEmailVerificationToken,
  EmailVerificationToken,
  emailVerificationTokens,
} from 'src/infrastructure/database/schema';
import { IEmailVerificationTokenRepository } from '../../../../modules/auth/interfaces/email-verification-tokens-repositry.interface';
import { DatabaseService } from 'src/infrastructure/database/database.service';
import { eq } from 'drizzle-orm';


@Injectable()
export class DrizzleEmailVeriRepository implements IEmailVerificationTokenRepository {
  constructor(private readonly db: DatabaseService) { }

  async create(
    data: NewEmailVerificationToken,
  ): Promise<EmailVerificationToken | undefined> {
    const newData = await this.db.client
      .insert(emailVerificationTokens)
      .values(data)
      .returning();
    return newData[0];
  }

  async findValidToken(userId: string): Promise<EmailVerificationToken | undefined> {
    let data = await this.db.client.select().from(emailVerificationTokens).where(eq(emailVerificationTokens.userId, userId))
    return data[0];
  }

  async delete(id: string): Promise<void> {
    await this.db.client.delete(emailVerificationTokens).where(eq(emailVerificationTokens.id, id))
  }
}
