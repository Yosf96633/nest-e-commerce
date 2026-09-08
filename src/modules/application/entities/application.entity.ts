export const APPLICATION_TYPES = ['seller', 'rider'] as const;
export const APPLICATION_STATUSES = [
  'pending',
  'approved',
  'rejected',
] as const;

export type ApplicationType = (typeof APPLICATION_TYPES)[number];
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export interface Application {
  id: string;
  userId: string;
  type: ApplicationType;
  status: ApplicationStatus;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateApplicationData {
  userId: string;
  type: ApplicationType;
}

export interface ReviewApplicationData {
  status?: ApplicationStatus;
  reviewedBy?: string;
  rejectionReason?: string;
}

export interface ApplicationApplicant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  profileImage: string | null;
  isEmailVerified: boolean;
  createdAt: Date;
}

export interface ApplicationListItem {
  id: string;
  type: ApplicationType;
  status: ApplicationStatus;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
  user: ApplicationApplicant;
}
