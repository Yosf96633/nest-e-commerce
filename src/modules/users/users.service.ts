import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  CreateUserData,
  UpdateUserData,
  User,
  UserWithRoles,
} from './entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import {
  AuthSession,
  CreateAuthSessionData,
} from './entities/auth-session.entity';
import { Role } from '@/common/types/role.type';
import {
  type IUsersRepository,
  USERS_REPOSITORY,
} from './interfaces/users-repository.interface';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CloudinaryService } from '@/infrastructure/cloudinary/cloudinary.service';
import { TokenUtility } from '@/modules/auth/utils/token.utils';
import { HashingUtil } from '@/modules/auth/utils/hashing.util';

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

  async getMyProfile(userId: string): Promise<UserWithRoles> {
    return this.getByIdWithRoles(userId);
  }

  async deleteProfileImage(userId: string): Promise<UserWithRoles> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(
        `User with id '${userId}' not found`,
        'USER_NOT_FOUND',
      );
    }
    if (!user.profileImagePublicId) {
      throw new NotFoundException(
        'No profile image is set',
        'PROFILE_IMAGE_NOT_FOUND',
      );
    }

    await this.usersRepository.update(userId, {
      profileImage: null,
      profileImagePublicId: null,
    });
    await this.cloudinaryService
      .deleteImage(user.profileImagePublicId)
      .catch(() => undefined);

    return this.getByIdWithRoles(userId);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(
        `User with id '${userId}' not found`,
        'USER_NOT_FOUND',
      );
    }
    if (
      !(await TokenUtility.compareToken(currentPassword, user.passwordHash))
    ) {
      throw new UnauthorizedException(
        'Current password is incorrect',
        'INVALID_CURRENT_PASSWORD',
      );
    }
    if (currentPassword === newPassword) {
      throw new BadRequestException(
        'New password must differ from the current password',
        'PASSWORD_UNCHANGED',
      );
    }

    await this.usersRepository.update(userId, {
      passwordHash: await HashingUtil.hashPassword(newPassword),
    });
    await this.usersRepository.revokeAllSessions(userId);
    return {
      message: 'Password changed. Please sign in again on your devices.',
    };
  }

  async getSessions(userId: string) {
    const sessions =
      await this.usersRepository.findActiveSessionsByUserId(userId);
    return sessions.map(
      ({ id, createdAt, expiresAt, userAgent, ipAddress }) => ({
        id,
        createdAt,
        expiresAt,
        userAgent,
        ipAddress,
      }),
    );
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const revoked = await this.usersRepository.revokeSession(userId, sessionId);
    if (!revoked) {
      throw new NotFoundException(
        'Active session not found',
        'SESSION_NOT_FOUND',
      );
    }
  }

  async revokeAllSessions(userId: string): Promise<{ revokedCount: number }> {
    const revokedCount = await this.usersRepository.revokeAllSessions(userId);
    return { revokedCount };
  }

  async deleteAccount(
    userId: string,
    password: string,
  ): Promise<{ message: string }> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(
        `User with id '${userId}' not found`,
        'USER_NOT_FOUND',
      );
    }
    if (!(await TokenUtility.compareToken(password, user.passwordHash))) {
      throw new UnauthorizedException(
        'Password is incorrect',
        'INVALID_PASSWORD',
      );
    }

    const cloudinaryPublicIds =
      await this.usersRepository.findCloudinaryPublicIdsForUser(userId);
    await this.usersRepository.delete(userId);
    await Promise.allSettled(
      cloudinaryPublicIds.map((publicId) =>
        this.cloudinaryService.deleteImage(publicId),
      ),
    );
    return { message: 'Account and associated data deleted successfully' };
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

  async createSessionWithRefreshToken(
    session: CreateAuthSessionData,
    token: { id: string; tokenHash: string; expiresAt: Date },
  ): Promise<void> {
    return this.usersRepository.createSessionWithRefreshToken(session, token);
  }

  async findRefreshTokenById(
    userId: string,
    tokenId: string,
  ): Promise<RefreshToken | undefined> {
    return this.usersRepository.findRefreshTokenById(userId, tokenId);
  }

  async rotateRefreshToken(
    userId: string,
    sessionId: string,
    currentTokenId: string,
    newToken: { id: string; tokenHash: string; expiresAt: Date },
  ): Promise<boolean> {
    return this.usersRepository.rotateRefreshToken(
      userId,
      sessionId,
      currentTokenId,
      newToken,
    );
  }

  async findActiveSessionsByUserId(userId: string): Promise<AuthSession[]> {
    return this.usersRepository.findActiveSessionsByUserId(userId);
  }

  async revokeSessionById(userId: string, sessionId: string): Promise<boolean> {
    return this.usersRepository.revokeSession(userId, sessionId);
  }
}
