import {
  EmailVerificationToken,
  NewEmailVerificationToken,
} from 'src/infrastructure/database/schema';

export interface IEmailVerificationTokenRepository {
  create(data: NewEmailVerificationToken): Promise<EmailVerificationToken | undefined>;
}

export const EMAIL_VERIFICATION_TOKEN_REPOSITORY = Symbol('IEmailVerificationTokenRepository');
