import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Delete,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/add-roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RoleGuard } from '@/common/guards/role.guard';
import type { JwtPayload } from '@/common/types/jwt-payload.type';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RoleGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMyProfile(@CurrentUser() user: JwtPayload) {
    return this.usersService.getMyProfile(user.sub);
  }

  @Patch(['me', 'profile'])
  @UseInterceptors(
    FileInterceptor('profileImage', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_request, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/i)) {
          return callback(
            new BadRequestException(
              'Only image files (jpg, jpeg, png, webp) are allowed for profileImage',
            ),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() data: UpdateProfileDto,
    @UploadedFile() profileImage?: Express.Multer.File,
  ) {
    return this.usersService.updateProfile(user.sub, data, profileImage);
  }

  @Delete('me/profile-image')
  async deleteMyProfileImage(@CurrentUser() user: JwtPayload) {
    return this.usersService.deleteProfileImage(user.sub);
  }

  @Patch('me/password')
  async changeMyPassword(
    @CurrentUser() user: JwtPayload,
    @Body() data: ChangePasswordDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.usersService.changePassword(
      user.sub,
      data.currentPassword,
      data.newPassword,
    );
    response.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/auth',
    });
    return result;
  }

  @Get('me/sessions')
  async getMySessions(@CurrentUser() user: JwtPayload) {
    return this.usersService.getSessions(user.sub);
  }

  @Delete('me/sessions/:id')
  @HttpCode(200)
  async revokeMySession(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    await this.usersService.revokeSession(user.sub, id);
    return { message: 'Session revoked successfully' };
  }

  @Delete('me/sessions')
  @HttpCode(200)
  async revokeAllMySessions(
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.usersService.revokeAllSessions(user.sub);
    response.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/auth',
    });
    return result;
  }

  @Delete('me')
  @HttpCode(200)
  async deleteMyAccount(
    @CurrentUser() user: JwtPayload,
    @Body() data: DeleteAccountDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.usersService.deleteAccount(
      user.sub,
      data.password,
    );
    response.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/auth',
    });
    return result;
  }

  @Get()
  @Roles('admin')
  async getAllUsers() {
    return this.usersService.getAllWithRoles();
  }

  @Get(':id')
  @Roles('admin')
  async getUserById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.usersService.getByIdWithRoles(id);
  }
}
