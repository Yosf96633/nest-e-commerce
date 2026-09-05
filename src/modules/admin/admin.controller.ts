import { Body, Controller, Get, HttpCode, Param, Patch, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from '@/common/decorators/add-roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RoleGuard } from '@/common/guards/role.guard';
import { UpdateApplicationDto } from './dto/update-application.dto';

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
    async getAllApplication() {
        return this.adminService.viewAllApplication()
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
