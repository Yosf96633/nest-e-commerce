import { Inject, Injectable } from '@nestjs/common';
import {
  APPLICATIONS_REPOSITORY,
  type IApplicationRepository,
} from '../application/interfaces/application-repository.interface';
import {
  Application,
  ApplicationStatus,
} from '../application/entities/application.entity';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { UsersService } from '../users/users.service';
@Injectable()
export class AdminService {
  constructor(
    @Inject(APPLICATIONS_REPOSITORY)
    private readonly applicationRepository: IApplicationRepository,
    private readonly userService: UsersService,
  ) {}

  async viewAllApplication(status?: ApplicationStatus) {
    const applications =
      await this.applicationRepository.getAllApplications(status);
    return applications;
  }

  async approveApplication(id: string, adminId: string): Promise<Application> {
    const application =
      await this.applicationRepository.approve_or_rejectApplication(id, {
        status: 'approved',
        reviewedBy: adminId,
      });
    await this.userService.assignRole(application.userId, application.type);
    return application;
  }

  async rejectApplication(
    id: string,
    adminId: string,
    data: UpdateApplicationDto,
  ) {
    const application =
      await this.applicationRepository.approve_or_rejectApplication(id, {
        status: 'rejected',
        reviewedBy: adminId,
        rejectionReason: data.rejectionReason,
      });
    return application;
  }
}
