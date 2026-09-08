export interface User {
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

export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string | null;
  passwordHash: string;
  profileImage?: string | null;
}
