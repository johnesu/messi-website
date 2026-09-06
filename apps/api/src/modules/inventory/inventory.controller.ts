import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import type { InventoryTransactionType } from '@prisma/client';
import { InventoryService } from './inventory.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/auth.decorator';
import { NotFoundError } from '../../common/errors/app-error';
import { PrismaService } from '../../common/prisma/prisma.service';

@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @Permissions('inventory.view')
  list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('lowStock') lowStock?: string,
  ) {
    return this.inventoryService.list({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      warehouseId,
      lowStock: lowStock === 'true',
    });
  }

  @Get('transactions')
  @Permissions('inventory.view')
  transactions(@Query('page') page?: string, @Query('limit') limit?: string, @Query('productId') productId?: string) {
    return this.inventoryService.listTransactions({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      productId,
    });
  }

  @Post('adjust')
  @HttpCode(200)
  @Permissions('inventory.adjust')
  adjust(
    @Body() body: {
      productId: string;
      variantId?: string | null;
      warehouseId?: string;
      quantity: number;
      type?: InventoryTransactionType;
      reason?: string;
    },
    @CurrentUser('id') actorId: string | undefined,
    @Req() req: Request,
  ) {
    return this.inventoryService.adjust({
      ...body,
      actorId: actorId ?? '',
      req,
    });
  }

  @Get('warehouses')
  @Permissions('inventory.view')
  warehouses() {
    return this.prisma.warehouse.findMany({ orderBy: { name: 'asc' } });
  }

  @Get(':productId')
  stock(@Param('productId') productId: string) {
    return this.inventoryService.getStock(productId);
  }
}
