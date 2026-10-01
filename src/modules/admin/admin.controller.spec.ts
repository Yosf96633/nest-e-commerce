import { validate } from 'class-validator';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { GetApplicationsQueryDto } from './dto/get-applications-query.dto';

describe('AdminController', () => {
  const adminService = {
    viewAllApplication: jest.fn(),
  } as unknown as AdminService;
  const controller = new AdminController(adminService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('gets every application when status is omitted', async () => {
    await controller.getAllApplication({});

    expect(adminService.viewAllApplication).toHaveBeenCalledWith(undefined);
  });

  it('forwards the requested status filter', async () => {
    await controller.getAllApplication({ status: 'pending' });

    expect(adminService.viewAllApplication).toHaveBeenCalledWith('pending');
  });

  it('rejects an unsupported status', async () => {
    const query = new GetApplicationsQueryDto();
    query.status = 'unknown' as never;

    const errors = await validate(query);

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints?.isEnum).toBe(
      'status must be one of: pending, approved, rejected',
    );
  });
});
