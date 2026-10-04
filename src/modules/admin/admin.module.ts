import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ApplicationModule } from '../application/application.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [ApplicationModule, UsersModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
