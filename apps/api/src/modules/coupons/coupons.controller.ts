import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { Permissions } from '../../common/decorators/auth.decorator';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Get()
  @Permissions('coupons.view')
  list(@Query('page') page?: string, @Query('limit') limit?: string, @Query('isActive') isActive?: string) {
    return this.couponsService.list({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      isActive,
    });
  }

  @Post()
  @Permissions('coupons.create')
  create(@Body() body: Parameters<CouponsService['create']>[0]) {
    return this.couponsService.create(body);
  }

  @Patch(':id')
  @Permissions('coupons.update')
  update(@Param('id') id: string, @Body() body: Parameters<CouponsService['update']>[1]) {
    return this.couponsService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(200)
  @Permissions('coupons.delete')
  remove(@Param('id') id: string) {
    return this.couponsService.remove(id);
  }
}
