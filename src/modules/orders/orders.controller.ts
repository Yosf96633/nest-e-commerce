import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/add-roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RoleGuard } from '@/common/guards/role.guard';
import type { JwtPayload } from '@/common/types/jwt-payload.type';
import { CheckoutDto } from './dto/checkout.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(JwtAuthGuard, RoleGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles('customer')
  checkout(@CurrentUser() user: JwtPayload, @Body() dto: CheckoutDto) {
    return this.ordersService.checkout(user.sub, dto);
  }

  @Get()
  @Roles('customer')
  listForUser(@CurrentUser() user: JwtPayload) {
    return this.ordersService.listForUser(user.sub);
  }

  @Get('rider/current')
  @Roles('rider')
  listForRider(@CurrentUser() user: JwtPayload) {
    return this.ordersService.listForRider(user.sub);
  }

  @Patch('rider/:orderId/status')
  @Roles('rider')
  updateRiderStatus(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateRiderStatus(orderId, user.sub, dto.status);
  }

  @Get(':orderId')
  @Roles('customer')
  getForUser(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.ordersService.getForUser(orderId, user.sub);
  }

  @Patch(':orderId/cancel')
  @Roles('customer')
  cancel(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.ordersService.cancel(orderId, user.sub);
  }
}
