import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle, NeonDatabase } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from './schema';

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  private readonly pool: Pool;
  private readonly db: NeonDatabase<typeof schema>;

  constructor(private readonly config: ConfigService) {
    const connectionString = this.config.getOrThrow<string>('DATABASE_URL');
    neonConfig.webSocketConstructor = ws;
    this.pool = new Pool({ connectionString });
    this.db = drizzle(this.pool, { schema });
  }

  get client(): NeonDatabase<typeof schema> {
    return this.db;
  }

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}
