import { Inject, Injectable } from '@nestjs/common';
import { User, NewUser } from '../database/schema';
import { Role } from '../database/schema/user-roles.schema';
import {
  type IUsersRepository,
  USERS_REPOSITORY,
} from './interfaces/users-repository.interface';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
  ) { }

  async findById(id: string): Promise<User | undefined> {
    return this.usersRepository.findById(id);
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.usersRepository.findByEmail(email);
  }

  async findByUsername(username: string): Promise<User | undefined> {
    return this.usersRepository.findByUsername(username);
  }

  async create(data: NewUser): Promise<User> {
    return this.usersRepository.create(data);
  }

  async markEmailVerified(userId: string): Promise<void> {
    return this.usersRepository.markEmailVerified(userId);
  }

  async getRoles(userId: string): Promise<Role[]> {
    return this.usersRepository.getRoles(userId);
  }

  async assignRole(userId: string, role: Role): Promise<void> {
    return this.usersRepository.assignRole(userId, role);
  }
}
