import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { ROLE_READER } from '@/common/interfaces/role-reader.interface';
import { DrizzleRoleReader } from './repositories/role/drizzle-role-reader';
@Global()
@Module({
  providers: [
    DatabaseService,
    {
      provide: ROLE_READER,
      useClass: DrizzleRoleReader,
    },
  ],
  exports: [DatabaseService, ROLE_READER],
})
export class DatabaseModule {}
