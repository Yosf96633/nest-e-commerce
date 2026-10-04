import { AdminService } from './admin.service';
import type { IApplicationRepository } from '../application/interfaces/application-repository.interface';
import { UsersService } from '../users/users.service';

describe('AdminService', () => {
  const getAllApplications = jest.fn();
  const reviewApplication = jest.fn();
  const assignRole = jest.fn();
  const applicationRepository = {
    getAllApplications,
    approve_or_rejectApplication: reviewApplication,
  } as unknown as IApplicationRepository;
  const usersService = {
    assignRole,
  } as unknown as UsersService;
  const service = new AdminService(applicationRepository, usersService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requests every application when status is omitted', async () => {
    getAllApplications.mockResolvedValue([]);

    await service.viewAllApplication();

    expect(getAllApplications).toHaveBeenCalledWith(undefined);
  });

  it('passes the status filter to the repository', async () => {
    getAllApplications.mockResolvedValue([]);

    await service.viewAllApplication('rejected');

    expect(getAllApplications).toHaveBeenCalledWith('rejected');
  });

  it('assigns the role matching an approved rider application', async () => {
    reviewApplication.mockResolvedValue({
      id: 'application-id',
      userId: 'user-id',
      type: 'rider',
      status: 'approved',
      reviewedBy: 'admin-id',
      reviewedAt: new Date('2026-01-01T00:00:00.000Z'),
      rejectionReason: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    await service.approveApplication('application-id', 'admin-id');

    expect(assignRole).toHaveBeenCalledWith('user-id', 'rider');
    expect(reviewApplication).toHaveBeenCalledWith('application-id', {
      status: 'approved',
      reviewedBy: 'admin-id',
    });
  });
});
