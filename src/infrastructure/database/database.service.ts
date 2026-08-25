import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { neon } from '@neondatabase/serverless';
import { drizzle, NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

@Injectable()
export class DatabaseService {
  private readonly db: NeonHttpDatabase<typeof schema>;

  constructor(private readonly config: ConfigService) {
    const connectionString = this.config.getOrThrow<string>('DATABASE_URL');
    const sql = neon(connectionString);
    this.db = drizzle(sql, { schema: schema });
  }

  get client(): NeonHttpDatabase<typeof schema> {
    return this.db;
  }
}
