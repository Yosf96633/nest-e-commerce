import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ApplicationModule } from '../application/application.module';

@Module({
  imports: [ApplicationModule],
  controllers: [AdminController],
  providers: [AdminService]
})
export class AdminModule { }
