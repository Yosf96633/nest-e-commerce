import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { ROLE_READER } from '@/common/interfaces/role-reader.interface';
import { DrizzleRoleReader } from './repositories/role/drizzle-role-reader';
import { SESSION_READER } from '@/common/interfaces/session-reader.interface';
import { DrizzleSessionReader } from './repositories/session/drizzle-session-reader';
@Global()
@Module({
  providers: [
    DatabaseService,
    {
      provide: ROLE_READER,
      useClass: DrizzleRoleReader,
    },
    {
      provide: SESSION_READER,
      useClass: DrizzleSessionReader,
    },
  ],
  exports: [DatabaseService, ROLE_READER, SESSION_READER],
})
export class DatabaseModule {}
