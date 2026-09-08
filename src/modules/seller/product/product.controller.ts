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
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create.product.dto';
import { UpdateProductDto } from './dto/update.product.dto';
import { ProductImageUploadInterceptor } from './interceptors/product-image-upload.interceptor';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RoleGuard } from '@/common/guards/role.guard';
import { Roles } from '@/common/decorators/add-roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { JwtPayload } from '@/common/types/jwt-payload.type';

@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('seller')
  @UseInterceptors(ProductImageUploadInterceptor)
  async createProduct(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateProductDto,
  ) {
    return this.productService.createProduct(user.sub, dto);
  }

  @Get('my-products')
  @HttpCode(HttpStatus.OK)
  @Roles('seller')
  async getMyProducts(@CurrentUser() user: JwtPayload) {
    return this.productService.getMyProducts(user.sub);
  }

  @Get('id/:id')
  @HttpCode(HttpStatus.OK)
  @Roles('seller')
  async getProductById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.productService.getProductById(id, user.sub);
  }

  @Get('slug/:slug')
  @HttpCode(HttpStatus.OK)
  @Roles('seller')
  async getProductBySlug(
    @Param('slug') slug: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.productService.getProductBySlug(slug, user.sub);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('seller')
  @UseInterceptors(ProductImageUploadInterceptor)
  async updateProduct(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productService.updateProduct(id, user.sub, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('seller')
  async deleteProduct(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.productService.deleteProduct(id, user.sub);
  }
}
