import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/add-roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RoleGuard } from '@/common/guards/role.guard';
import type { JwtPayload } from '@/common/types/jwt-payload.type';
import { CreateRiderProfileDto } from './dto/create-rider-profile.dto';
import { UpdateRiderAvailabilityDto } from './dto/update-rider-availability.dto';
import { UpdateRiderProfileDto } from './dto/update-rider-profile.dto';
import { RiderService } from './rider.service';

@Controller('rider')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles('rider')
export class RiderController {
  constructor(private readonly riderService: RiderService) {}

  @Post('profile')
  createProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateRiderProfileDto,
  ) {
    return this.riderService.createProfile(user.sub, dto);
  }

  @Get('profile')
  getProfile(@CurrentUser() user: JwtPayload) {
    return this.riderService.getProfile(user.sub);
  }

  @Patch('profile')
  updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateRiderProfileDto,
  ) {
    return this.riderService.updateProfile(user.sub, dto);
  }

  @Patch('availability')
  updateAvailability(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateRiderAvailabilityDto,
  ) {
    return this.riderService.updateAvailability(user.sub, dto.isAvailable);
  }
}
