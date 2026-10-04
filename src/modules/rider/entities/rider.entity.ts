export const RIDER_VEHICLE_TYPES = [
  'bicycle',
  'motorcycle',
  'car',
  'van',
] as const;

export type RiderVehicleType = (typeof RIDER_VEHICLE_TYPES)[number];

export interface RiderProfile {
  id: string;
  userId: string;
  vehicleType: RiderVehicleType;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleColor: string | null;
  plateNumber: string | null;
  licenseNumber: string | null;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRiderProfileData {
  userId: string;
  vehicleType: RiderVehicleType;
  vehicleMake?: string | null;
  vehicleModel?: string | null;
  vehicleColor?: string | null;
  plateNumber?: string | null;
  licenseNumber?: string | null;
}

export interface UpdateRiderProfileData {
  vehicleType?: RiderVehicleType;
  vehicleMake?: string | null;
  vehicleModel?: string | null;
  vehicleColor?: string | null;
  plateNumber?: string | null;
  licenseNumber?: string | null;
}
