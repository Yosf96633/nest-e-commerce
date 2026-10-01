import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/add-roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RoleGuard } from '@/common/guards/role.guard';
import type { JwtPayload } from '@/common/types/jwt-payload.type';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RoleGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('profile')
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

  @Get()
  @Roles('admin')
  async getAllUsers() {
    return this.usersService.getAllWithRoles();
  }

  @Get(':id')
  @Roles("admin")
  async getUserById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.usersService.getByIdWithRoles(id);
  }
}
