export interface EmailVerificationToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  consumedAt: Date | null;
  createdAt: Date;
}

export interface CreateEmailVerificationTokenData {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}
