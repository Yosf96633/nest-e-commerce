import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApplicationService } from './application.service';
import { CreateApplicationDto } from './dto/create.application.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { JwtPayload } from '@/common/types/jwt-payload.type';

@Controller('application')
export class ApplicationController {
    constructor(private readonly applicationService: ApplicationService) { }

    @Post('/create')
    @HttpCode(201)
    @UseGuards(JwtAuthGuard)
    async createApplication(
        @Body() application: CreateApplicationDto,
        @CurrentUser() user: JwtPayload,
    ) {
        return this.applicationService.createApplication({
            userId: user.sub,
            ...application,
        });
    }
}
