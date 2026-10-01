import { AdminService } from './admin.service';
import type { IApplicationRepository } from '../application/interfaces/application-repository.interface';
import { UsersService } from '../users/users.service';

describe('AdminService', () => {
  const applicationRepository = {
    getAllApplications: jest.fn(),
  } as unknown as IApplicationRepository;
  const usersService = {
    assignRole: jest.fn(),
  } as unknown as UsersService;
  const service = new AdminService(applicationRepository, usersService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requests every application when status is omitted', async () => {
    jest
      .spyOn(applicationRepository, 'getAllApplications')
      .mockResolvedValue([]);

    await service.viewAllApplication();

    expect(applicationRepository.getAllApplications).toHaveBeenCalledWith(
      undefined,
    );
  });

  it('passes the status filter to the repository', async () => {
    jest
      .spyOn(applicationRepository, 'getAllApplications')
      .mockResolvedValue([]);

    await service.viewAllApplication('rejected');

    expect(applicationRepository.getAllApplications).toHaveBeenCalledWith(
      'rejected',
    );
  });
});
