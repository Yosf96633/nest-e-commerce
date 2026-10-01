import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { DrizzleUsersRepository } from '../../infrastructure/database/repositories/users/drizzle-users.repository';
import { USERS_REPOSITORY } from './interfaces/users-repository.interface';
import { UsersController } from './users.controller';
import { CloudinaryModule } from '@/infrastructure/cloudinary/cloudinary.module';

@Module({
  imports: [CloudinaryModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: USERS_REPOSITORY,
      useClass: DrizzleUsersRepository,
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}
