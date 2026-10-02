import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { JwtPayload } from '@/common/types/jwt-payload.type';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get() get(@CurrentUser() user: JwtPayload) { return this.cart.get(user.sub); }
  @Post('items') add(@CurrentUser() user: JwtPayload, @Body() dto: AddCartItemDto) { return this.cart.add(user.sub, dto); }
  @Patch('items/:productId') update(@CurrentUser() user: JwtPayload, @Param('productId', ParseUUIDPipe) productId: string, @Body() dto: UpdateCartItemDto) { return this.cart.update(user.sub, productId, dto.quantity); }
  @Delete('items/:productId') remove(@CurrentUser() user: JwtPayload, @Param('productId', ParseUUIDPipe) productId: string) { return this.cart.remove(user.sub, productId); }
  @Delete() clear(@CurrentUser() user: JwtPayload) { return this.cart.clear(user.sub); }
}
