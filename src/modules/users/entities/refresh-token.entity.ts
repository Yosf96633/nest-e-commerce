export interface RefreshToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  revokedAt: Date | null;
  replacedBy: string | null;
  userAgent: string | null;
  ipAddress: string | null;
}
