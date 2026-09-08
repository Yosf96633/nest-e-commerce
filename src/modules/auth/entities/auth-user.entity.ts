export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  passwordHash: string;
  profileImage: string | null;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAuthUserData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string | null;
  passwordHash: string;
  profileImage?: string | null;
}
