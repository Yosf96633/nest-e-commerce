import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { DrizzleUsersRepository } from './repositories/drizzle-users.repository';
import { USERS_REPOSITORY } from './interfaces/users-repository.interface';

@Module({
  providers: [
    UsersService,
    {
      provide: USERS_REPOSITORY,
      useClass: DrizzleUsersRepository,
    },
  ],
  exports: [UsersService],
})
export class UsersModule { }
