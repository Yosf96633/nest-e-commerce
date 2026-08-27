import { Inject, Injectable } from '@nestjs/common';
import { User, NewUser, RefreshToken } from '../../infrastructure/database/schema';
import { Role } from '../../infrastructure/database/schema/user-roles.schema';
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

  async storeRefreshToken(userId: string, refreshToken: string, expiresAt: Date): Promise<RefreshToken> {
    return this.usersRepository.storeRefreshToken(userId, refreshToken, expiresAt);
  }

  async findActiveRefreshTokensByUserId(userId: string): Promise<RefreshToken[]> {
    return this.usersRepository.findActiveRefreshTokensByUserId(userId);
  }

  async revokeRefreshToken(tokenId: string, replacedByTokenId?: string): Promise<void> {
    return this.usersRepository.revokeRefreshToken(tokenId, replacedByTokenId);
  }
}
