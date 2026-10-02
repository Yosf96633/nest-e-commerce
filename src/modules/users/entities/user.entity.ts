import type { Role } from '@/common/types/role.type';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  passwordHash: string;
  profileImage: string | null;
  profileImagePublicId: string | null;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string | null;
  passwordHash: string;
  profileImage?: string | null;
  profileImagePublicId?: string | null;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string | null;
  profileImage?: string | null;
  profileImagePublicId?: string | null;
  passwordHash?: string;
}

export type UserProfile = Omit<User, 'passwordHash' | 'profileImagePublicId'>;

export interface UserWithRoles extends UserProfile {
  roles: Role[];
}
