import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { StoreService } from './store.service';
import { CreateStoreDto } from './dto/create.store.dto';
import { UpdateStoreDto } from './dto/update.store.dto';
import { StoreImageUploadInterceptor } from './interceptors/store-image-upload.interceptor';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RoleGuard } from '@/common/guards/role.guard';
import { Roles } from '@/common/decorators/add-roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { JwtPayload } from '@/common/types/jwt-payload.type';

@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('seller')
  @UseInterceptors(StoreImageUploadInterceptor)
  async createStore(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateStoreDto,
  ) {
    return this.storeService.createStore(user.sub, dto);
  }

  @Get('my-stores')
  @HttpCode(HttpStatus.OK)
  @Roles('seller')
  async getMyStores(@CurrentUser() user: JwtPayload) {
    return this.storeService.getMyStores(user.sub);
  }

  @Get('seller/:sellerId')
  @HttpCode(HttpStatus.OK)
  async getStoresBySellerId(
    @Param('sellerId', new ParseUUIDPipe()) sellerId: string,
  ) {
    return this.storeService.getStoresBySellerId(sellerId);
  }

  @Get('id/:id')
  @HttpCode(HttpStatus.OK)
  async getStoreById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.storeService.getStoreById(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('seller')
  @UseInterceptors(StoreImageUploadInterceptor)
  async updateStore(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateStoreDto,
  ) {
    return this.storeService.updateStore(id, user.sub, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('seller')
  async deleteStore(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.storeService.deleteStore(id, user.sub);
  }

  @Get(':slug')
  @HttpCode(HttpStatus.OK)
  async getStoreBySlug(@Param('slug') slug: string) {
    return this.storeService.getStoreBySlug(slug);
  }
}
