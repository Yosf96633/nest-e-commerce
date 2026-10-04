import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { RiderProfile } from './entities/rider.entity';
import type { IRiderRepository } from './interfaces/rider.repository.interface';
import { RiderService } from './rider.service';

describe('RiderService', () => {
  let repository: jest.Mocked<IRiderRepository>;
  let service: RiderService;

  const profile: RiderProfile = {
    id: 'profile-id',
    userId: 'user-id',
    vehicleType: 'motorcycle',
    vehicleMake: 'Honda',
    vehicleModel: 'CG 125',
    vehicleColor: 'Black',
    plateNumber: 'ABC-123',
    licenseNumber: 'LIC-123',
    isAvailable: false,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    repository = {
      findByUserId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateAvailability: jest.fn(),
    };
    service = new RiderService(repository);
  });

  it('requires plate and license numbers for motor vehicles', async () => {
    await expect(
      service.createProfile('user-id', { vehicleType: 'motorcycle' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('normalizes rider vehicle identifiers', async () => {
    repository.create.mockResolvedValue(profile);

    await service.createProfile('user-id', {
      vehicleType: 'motorcycle',
      vehicleMake: ' Honda ',
      plateNumber: ' abc-123 ',
      licenseNumber: ' lic-123 ',
    });

    expect(repository.create).toHaveBeenCalledWith({
      userId: 'user-id',
      vehicleType: 'motorcycle',
      vehicleMake: 'Honda',
      vehicleModel: null,
      vehicleColor: null,
      plateNumber: 'ABC-123',
      licenseNumber: 'LIC-123',
    });
  });

  it('reports conflicting profiles or vehicle identifiers', async () => {
    repository.create.mockResolvedValue(undefined);

    await expect(
      service.createProfile('user-id', { vehicleType: 'bicycle' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('validates the combined current and updated vehicle data', async () => {
    repository.findByUserId.mockResolvedValue({
      ...profile,
      vehicleType: 'bicycle',
      plateNumber: null,
      licenseNumber: null,
    });

    await expect(
      service.updateProfile('user-id', { vehicleType: 'car' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('requires a profile before availability can be changed', async () => {
    repository.updateAvailability.mockResolvedValue(undefined);

    await expect(
      service.updateAvailability('user-id', true),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
