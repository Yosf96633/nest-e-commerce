import {
  CreateEmailVerificationTokenData,
  EmailVerificationToken,
} from '../entities/email-verification-token.entity';

export interface IEmailVerificationTokenRepository {
  create(
    data: CreateEmailVerificationTokenData,
  ): Promise<EmailVerificationToken | undefined>;
  findValidToken(userId: string): Promise<EmailVerificationToken | undefined>;
  delete(id: string): Promise<void>;
}

export const EMAIL_VERIFICATION_TOKEN_REPOSITORY = Symbol('IEmailVerificationTokenRepository');
