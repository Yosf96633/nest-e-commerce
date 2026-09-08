import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DatabaseService } from '../../database.service';
import { userRoles } from '../../schema';
import { IRoleReader } from '@/common/interfaces/role-reader.interface';
import { Role } from '@/common/types/role.type';

@Injectable()
export class DrizzleRoleReader implements IRoleReader {
  constructor(private readonly db: DatabaseService) {}

  async getRoles(userId: string): Promise<Role[]> {
    const result = await this.db.client
      .select({ role: userRoles.role })
      .from(userRoles)
      .where(eq(userRoles.userId, userId));
    return result.map((record) => record.role);
  }
}
