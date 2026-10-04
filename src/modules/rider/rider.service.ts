import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRiderProfileDto } from './dto/create-rider-profile.dto';
import { UpdateRiderProfileDto } from './dto/update-rider-profile.dto';
import type {
  RiderProfile,
  RiderVehicleType,
  UpdateRiderProfileData,
} from './entities/rider.entity';
import { IRiderRepository } from './interfaces/rider.repository.interface';

@Injectable()
export class RiderService {
  constructor(
    @Inject(IRiderRepository)
    private readonly riderRepository: IRiderRepository,
  ) {}

  async getProfile(userId: string): Promise<RiderProfile> {
    const profile = await this.riderRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException(
        'Rider profile not found',
        'RIDER_PROFILE_NOT_FOUND',
      );
    }
    return profile;
  }

  async createProfile(
    userId: string,
    dto: CreateRiderProfileDto,
  ): Promise<RiderProfile> {
    const plateNumber = this.normalizeIdentifier(dto.plateNumber);
    const licenseNumber = this.normalizeIdentifier(dto.licenseNumber);
    this.assertVehicleDocuments(dto.vehicleType, plateNumber, licenseNumber);

    const profile = await this.riderRepository.create({
      userId,
      vehicleType: dto.vehicleType,
      vehicleMake: this.normalizeText(dto.vehicleMake),
      vehicleModel: this.normalizeText(dto.vehicleModel),
      vehicleColor: this.normalizeText(dto.vehicleColor),
      plateNumber,
      licenseNumber,
    });

    if (!profile) {
      throw new ConflictException(
        'A rider profile, plate number, or license number already exists',
        'RIDER_PROFILE_CONFLICT',
      );
    }
    return profile;
  }

  async updateProfile(
    userId: string,
    dto: UpdateRiderProfileDto,
  ): Promise<RiderProfile> {
    if (!Object.values(dto).some((value) => value !== undefined)) {
      throw new BadRequestException(
        'At least one rider profile field is required',
        'EMPTY_RIDER_PROFILE_UPDATE',
      );
    }

    const current = await this.getProfile(userId);
    const vehicleType = dto.vehicleType ?? current.vehicleType;
    const plateNumber =
      dto.plateNumber === undefined
        ? current.plateNumber
        : this.normalizeIdentifier(dto.plateNumber);
    const licenseNumber =
      dto.licenseNumber === undefined
        ? current.licenseNumber
        : this.normalizeIdentifier(dto.licenseNumber);
    this.assertVehicleDocuments(vehicleType, plateNumber, licenseNumber);

    const data: UpdateRiderProfileData = {
      ...(dto.vehicleType !== undefined
        ? { vehicleType: dto.vehicleType }
        : {}),
      ...(dto.vehicleMake !== undefined
        ? { vehicleMake: this.normalizeText(dto.vehicleMake) }
        : {}),
      ...(dto.vehicleModel !== undefined
        ? { vehicleModel: this.normalizeText(dto.vehicleModel) }
        : {}),
      ...(dto.vehicleColor !== undefined
        ? { vehicleColor: this.normalizeText(dto.vehicleColor) }
        : {}),
      ...(dto.plateNumber !== undefined ? { plateNumber } : {}),
      ...(dto.licenseNumber !== undefined ? { licenseNumber } : {}),
    };

    const updated = await this.riderRepository.update(userId, data);
    if (!updated) {
      throw new NotFoundException(
        'Rider profile not found',
        'RIDER_PROFILE_NOT_FOUND',
      );
    }
    return updated;
  }

  async updateAvailability(
    userId: string,
    isAvailable: boolean,
  ): Promise<RiderProfile> {
    if (isAvailable && (await this.riderRepository.hasActiveOrder(userId))) {
      throw new ConflictException(
        'A rider with an active order cannot become available',
        'RIDER_HAS_ACTIVE_ORDER',
      );
    }
    const updated = await this.riderRepository.updateAvailability(
      userId,
      isAvailable,
    );
    if (!updated) {
      throw new NotFoundException(
        'Create a rider profile before changing availability',
        'RIDER_PROFILE_NOT_FOUND',
      );
    }
    return updated;
  }

  private assertVehicleDocuments(
    vehicleType: RiderVehicleType,
    plateNumber: string | null,
    licenseNumber: string | null,
  ): void {
    if (vehicleType !== 'bicycle' && (!plateNumber || !licenseNumber)) {
      throw new BadRequestException(
        'Plate number and license number are required for motor vehicles',
        'RIDER_VEHICLE_DOCUMENTS_REQUIRED',
      );
    }
  }

  private normalizeText(value?: string | null): string | null {
    return value?.trim() || null;
  }

  private normalizeIdentifier(value?: string | null): string | null {
    return value?.trim().toUpperCase() || null;
  }
}
