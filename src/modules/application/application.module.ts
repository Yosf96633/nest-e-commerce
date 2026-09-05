import { Module } from '@nestjs/common';
import { ApplicationController } from './application.controller';
import { ApplicationService } from './application.service';
import { DrizzleApplicationRepository } from '../../infrastructure/database/repositories/application/drizzle-application.repository';
import { APPLICATIONS_REPOSITORY } from './interfaces/application-repository.interface';
import { DatabaseModule } from '../../infrastructure/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ApplicationController],
  providers: [
    ApplicationService,
    { provide: APPLICATIONS_REPOSITORY, useClass: DrizzleApplicationRepository },
  ],
  exports: [ApplicationService, APPLICATIONS_REPOSITORY],
})
export class ApplicationModule { }
