import { Injectable } from '@nestjs/common';
import {
  NewEmailVerificationToken,
  EmailVerificationToken,
  emailVerificationTokens,
} from 'src/infrastructure/database/schema';
import { IEmailVerificationTokenRepository } from '../interfaces/email-verification-tokens-repositry.interface';
import { DatabaseService } from 'src/infrastructure/database/database.service';

@Injectable()
export class DrizzleEmailVeriRepository implements IEmailVerificationTokenRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(
    data: NewEmailVerificationToken,
  ): Promise<EmailVerificationToken | undefined> {
    const newData = await this.db.client
      .insert(emailVerificationTokens)
      .values(data)
      .returning();
    return newData[0];
  }
}
