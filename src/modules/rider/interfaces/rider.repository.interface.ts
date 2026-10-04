import type {
  CreateRiderProfileData,
  RiderProfile,
  UpdateRiderProfileData,
} from '../entities/rider.entity';

export interface IRiderRepository {
  findByUserId(userId: string): Promise<RiderProfile | undefined>;
  create(data: CreateRiderProfileData): Promise<RiderProfile | undefined>;
  update(
    userId: string,
    data: UpdateRiderProfileData,
  ): Promise<RiderProfile | undefined>;
  updateAvailability(
    userId: string,
    isAvailable: boolean,
  ): Promise<RiderProfile | undefined>;
  hasActiveOrder(userId: string): Promise<boolean>;
}

export const IRiderRepository = Symbol('IRiderRepository');
