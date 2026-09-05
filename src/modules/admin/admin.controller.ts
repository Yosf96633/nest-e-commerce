import { Controller, Get, HttpCode, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from '@/common/decorators/add-roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RoleGuard } from '@/common/guards/role.guard';

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

}
