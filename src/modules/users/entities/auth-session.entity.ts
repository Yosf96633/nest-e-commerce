export interface AuthSession {
  id: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  revokedAt: Date | null;
  userAgent: string | null;
  ipAddress: string | null;
}

export interface CreateAuthSessionData {
  id: string;
  userId: string;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
}
