import { Injectable } from '@nestjs/common';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { ISessionReader } from '@/common/interfaces/session-reader.interface';
import { DatabaseService } from '../../database.service';
import { authSessions } from '../../schema';

@Injectable()
export class DrizzleSessionReader implements ISessionReader {
  constructor(private readonly db: DatabaseService) {}

  async isActive(sessionId: string, userId: string): Promise<boolean> {
    const result = await this.db.client
      .select({ id: authSessions.id })
      .from(authSessions)
      .where(
        and(
          eq(authSessions.id, sessionId),
          eq(authSessions.userId, userId),
          isNull(authSessions.revokedAt),
          gt(authSessions.expiresAt, new Date()),
        ),
      )
      .limit(1);
    return result.length === 1;
  }
}
