import { NotFoundException } from '@nestjs/common';
import type { IUsersRepository } from './interfaces/users-repository.interface';
import type { User, UserWithRoles } from './entities/user.entity';
import { UsersService } from './users.service';
import { CloudinaryService } from '@/infrastructure/cloudinary/cloudinary.service';

describe('UsersService', () => {
  const findById = jest.fn();
  const findByIdWithRoles = jest.fn();
  const findAllWithRoles = jest.fn();
  const update = jest.fn();
  const uploadImage = jest.fn();
  const deleteImage = jest.fn();
  const repository = {
    findById,
    findByIdWithRoles,
    findAllWithRoles,
    update,
  } as unknown as IUsersRepository;
  const cloudinaryService = {
    uploadImage,
    deleteImage,
  } as unknown as CloudinaryService;
  const service = new UsersService(repository, cloudinaryService);

  const profile: UserWithRoles = {
    id: '20243823-e478-46ab-a612-09f2c116b11e',
    firstName: 'Test',
    lastName: 'Seller',
    email: 'seller@example.com',
    phoneNumber: '+923001234567',
    profileImage: null,
    isEmailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    roles: ['customer', 'seller'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a user with roles', async () => {
    findByIdWithRoles.mockResolvedValue(profile);

    await expect(service.getByIdWithRoles(profile.id)).resolves.toEqual(
      profile,
    );
  });

  it('throws when a user does not exist', async () => {
    findByIdWithRoles.mockResolvedValue(undefined);

    await expect(
      service.getByIdWithRoles('b680f20a-e192-433f-bc41-dfb9f0c99442'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns every user with roles', async () => {
    findAllWithRoles.mockResolvedValue([profile]);

    await expect(service.getAllWithRoles()).resolves.toEqual([profile]);
  });

  it('updates the authenticated user profile and returns roles', async () => {
    const internalUser: User = {
      ...profile,
      passwordHash: 'hashed-password',
      profileImagePublicId: null,
    };
    const updatedProfile = { ...profile, firstName: 'Updated' };
    findById.mockResolvedValue(internalUser);
    update.mockResolvedValue({ ...internalUser, firstName: 'Updated' });
    findByIdWithRoles.mockResolvedValue(updatedProfile);

    await expect(
      service.updateProfile(profile.id, { firstName: 'Updated' }),
    ).resolves.toEqual(updatedProfile);
    expect(update).toHaveBeenCalledWith(profile.id, { firstName: 'Updated' });
  });

  it('uploads a new profile image and stores its Cloudinary metadata', async () => {
    const internalUser: User = {
      ...profile,
      passwordHash: 'hashed-password',
      profileImagePublicId: 'old-public-id',
    };
    const file = { buffer: Buffer.from('image') } as Express.Multer.File;
    findById.mockResolvedValue(internalUser);
    uploadImage.mockResolvedValue({
      secure_url: 'https://cloudinary.example/new-profile.jpg',
      public_id: 'new-public-id',
    });
    update.mockResolvedValue(internalUser);
    findByIdWithRoles.mockResolvedValue({
      ...profile,
      profileImage: 'https://cloudinary.example/new-profile.jpg',
    });
    deleteImage.mockResolvedValue({ result: 'ok' });

    await service.updateProfile(profile.id, {}, file);

    expect(uploadImage).toHaveBeenCalledWith(file, 'e-com/users/profiles');
    expect(update).toHaveBeenCalledWith(profile.id, {
      profileImage: 'https://cloudinary.example/new-profile.jpg',
      profileImagePublicId: 'new-public-id',
    });
    expect(deleteImage).toHaveBeenCalledWith('old-public-id');
  });
});
