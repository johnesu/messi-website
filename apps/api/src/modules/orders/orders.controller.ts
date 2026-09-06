import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/auth.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  myOrders(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.ordersService.findByUser(
      userId,
      { page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined },
      userId,
    );
  }

  @Get('all')
  @Permissions('orders.view')
  allOrders(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('q') q?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.ordersService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
      q,
      from,
      to,
    });
  }

  @Get('invoice/:id')
  invoice(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.ordersService.getInvoice(id, userId);
  }

  @Get(':id/admin')
  @Permissions('orders.view')
  adminOrder(@Param('id') id: string) {
    return this.ordersService.findByIdAdmin(id);
  }

  @Get(':id')
  myOrder(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.ordersService.findByIdForUser(id, userId);
  }

  @Patch(':id/status')
  @HttpCode(200)
  @Permissions('orders.update')
  updateStatus(
    @Param('id') id: string,
    @CurrentUser('id') actorId: string | undefined,
    @Body() body: { status: string; note?: string },
  ) {
    return this.ordersService.updateStatus(id, body.status, actorId ?? '', body.note);
  }
}
