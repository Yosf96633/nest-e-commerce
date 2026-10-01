import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateUserData,
  UpdateUserData,
  User,
  UserWithRoles,
} from './entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { Role } from '@/common/types/role.type';
import {
  type IUsersRepository,
  USERS_REPOSITORY,
} from './interfaces/users-repository.interface';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CloudinaryService } from '@/infrastructure/cloudinary/cloudinary.service';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async findById(id: string): Promise<User | undefined> {
    return this.usersRepository.findById(id);
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.usersRepository.findByEmail(email);
  }

  async getByIdWithRoles(id: string): Promise<UserWithRoles> {
    const user = await this.usersRepository.findByIdWithRoles(id);
    if (!user) {
      throw new NotFoundException(
        `User with id '${id}' not found`,
        'USER_NOT_FOUND',
      );
    }
    return user;
  }

  async getAllWithRoles(): Promise<UserWithRoles[]> {
    return this.usersRepository.findAllWithRoles();
  }

  async updateProfile(
    userId: string,
    data: UpdateProfileDto,
    profileImage?: Express.Multer.File,
  ): Promise<UserWithRoles> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(
        `User with id '${userId}' not found`,
        'USER_NOT_FOUND',
      );
    }

    const updateData: UpdateUserData = { ...data };
    let uploadedImage: { secureUrl: string; publicId: string } | undefined;

    try {
      if (profileImage) {
        const result = await this.cloudinaryService.uploadImage(
          profileImage,
          'e-com/users/profiles',
        );
        uploadedImage = {
          secureUrl: result.secure_url,
          publicId: result.public_id,
        };
        updateData.profileImage = uploadedImage.secureUrl;
        updateData.profileImagePublicId = uploadedImage.publicId;
      }

      await this.usersRepository.update(userId, updateData);
    } catch (error) {
      if (uploadedImage) {
        await this.cloudinaryService
          .deleteImage(uploadedImage.publicId)
          .catch(() => undefined);
      }
      throw error;
    }

    if (uploadedImage && user.profileImagePublicId) {
      await this.cloudinaryService
        .deleteImage(user.profileImagePublicId)
        .catch(() => undefined);
    }

    return this.getByIdWithRoles(userId);
  }

  async create(data: CreateUserData): Promise<User> {
    return this.usersRepository.create(data);
  }

  async delete(userId: string): Promise<void> {
    return this.usersRepository.delete(userId);
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

  async storeRefreshToken(
    userId: string,
    refreshToken: string,
    expiresAt: Date,
  ): Promise<RefreshToken> {
    return this.usersRepository.storeRefreshToken(
      userId,
      refreshToken,
      expiresAt,
    );
  }

  async findActiveRefreshTokensByUserId(
    userId: string,
  ): Promise<RefreshToken[]> {
    return this.usersRepository.findActiveRefreshTokensByUserId(userId);
  }

  async revokeRefreshToken(
    tokenId: string,
    replacedByTokenId?: string,
  ): Promise<void> {
    return this.usersRepository.revokeRefreshToken(tokenId, replacedByTokenId);
  }
}
