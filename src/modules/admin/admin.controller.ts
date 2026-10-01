import { Body, Controller, Get, HttpCode, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from '@/common/decorators/add-roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RoleGuard } from '@/common/guards/role.guard';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { GetApplicationsQueryDto } from './dto/get-applications-query.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RoleGuard)
export class AdminController {


    constructor(
        private readonly adminService: AdminService
    ) {

    }
    @Get('/applications')
    @HttpCode(200)
    @Roles('admin')
    async getAllApplication(@Query() query: GetApplicationsQueryDto) {
        return this.adminService.viewAllApplication(query.status)
    }

    @Patch('/approve-applications/:id')
    @HttpCode(200)
    @Roles('admin')
    async approveApplication(
        @Param('id') id: string,
        @Body() data: UpdateApplicationDto
    ) {
        return this.adminService.approveApplication(id, data)
    }

    @Patch("/reject-applications/:id")
    @HttpCode(200)
    @Roles('admin')
    async rejectApplication(
        @Param('id') id: string,
        @Body() data: UpdateApplicationDto
    ) {
        return this.adminService.approveApplication(id, data)
    }

}
