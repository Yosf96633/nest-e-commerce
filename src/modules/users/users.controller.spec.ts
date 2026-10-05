import type { JwtPayload } from '@/common/types/jwt-payload.type';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  const updateProfile = jest.fn();
  const getAllWithRoles = jest.fn();
  const getByIdWithRoles = jest.fn();
  const usersService = {
    updateProfile,
    getAllWithRoles,
    getByIdWithRoles,
  } as unknown as UsersService;
  const controller = new UsersController(usersService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates the profile belonging to the authenticated user', async () => {
    const user: JwtPayload = {
      sub: '20243823-e478-46ab-a612-09f2c116b11e',
      email: 'seller@example.com',
      sid: '0e4f694c-5ac5-4fca-8d7d-a79767807582',
      type: 'access',
    };

    await controller.updateProfile(user, { firstName: 'Updated' });

    expect(updateProfile).toHaveBeenCalledWith(
      user.sub,
      {
        firstName: 'Updated',
      },
      undefined,
    );
  });

  it('gets all users with roles', async () => {
    await controller.getAllUsers();

    expect(getAllWithRoles).toHaveBeenCalledTimes(1);
  });

  it('gets one user with roles', async () => {
    const id = '20243823-e478-46ab-a612-09f2c116b11e';

    await controller.getUserById(id);

    expect(getByIdWithRoles).toHaveBeenCalledWith(id);
  });
});
