import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotFoundError, BadRequestError, ErrorCodes } from '../../common/errors/app-error';
import { paginate, buildPaginationMeta } from '../../common/utils/pagination';
import type { InventoryTransactionType } from '@mesi/config';

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Decrement inventory to fulfill a paid order. Uses a transaction to safely
   * reduce product variant stock and the default (main) warehouse inventory,
   * recording an auditable inventory transaction for every change.
   */
  async decrementForSale(orderId: string, actorId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new NotFoundError('ORDER_NOT_FOUND', 'Order not found');

    const mainWarehouse = await this.prisma.warehouse.findFirst({
      where: { type: 'WAREHOUSE' },
      orderBy: { createdAt: 'asc' },
    });

    return this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        // Decrement variant stock (customer-facing)
        if (item.variantId) {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
          });
          if (variant) {
            if (variant.stock < item.quantity) {
              throw new BadRequestError(
                ErrorCodes.INSUFFICIENT_STOCK,
                `Insufficient stock for ${item.productName}`,
              );
            }
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: variant.stock - item.quantity },
            });
          }
        }

        // Warehouse inventory transaction
        if (mainWarehouse) {
          const inv = await tx.inventory.findFirst({
            where: {
              productId: item.productId,
              ...(item.variantId ? { variantId: item.variantId } : {}),
              warehouseId: mainWarehouse.id,
            },
          });
          if (inv && inv.quantity >= item.quantity) {
            const afterQty = inv.quantity - item.quantity;
            await tx.inventory.update({
              where: { id: inv.id },
              data: { quantity: afterQty },
            });
            await tx.inventoryTransaction.create({
              data: {
                inventoryId: inv.id,
                type: 'SALE',
                quantity: -item.quantity,
                beforeQty: inv.quantity,
                afterQty,
                reason: `Order ${order.orderNumber}`,
                referenceType: 'ORDER',
                referenceId: order.id,
                createdById: actorId ?? null,
              },
            });
          }
        }
      }
    });
  }

  async adjust(input: {
    productId: string;
    variantId?: string | null;
    warehouseId?: string;
    quantity: number;
    type?: InventoryTransactionType;
    reason?: string;
    actorId?: string;
    req?: unknown;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: input.productId } });
      if (!product) throw new NotFoundError('PRODUCT_NOT_FOUND', 'Product not found');

      const warehouseId = input.warehouseId ?? ((await tx.warehouse.findFirst({ orderBy: { createdAt: 'asc' } }))?.id);
      if (!warehouseId) throw new NotFoundError('WAREHOUSE_NOT_FOUND', 'No warehouse configured');

      const type = (input.type ?? 'ADJUSTMENT') as InventoryTransactionType;

      // Upsert inventory row
      let inv = await tx.inventory.findFirst({
        where: {
          productId: input.productId,
          variantId: input.variantId ?? null,
          warehouseId,
        },
      });
      const beforeQty = inv?.quantity ?? 0;
      let afterQty: number;
      if (type === 'SALE' || type === 'DAMAGED' || type === 'MANUAL_CORRECTION') {
        afterQty = Math.max(0, beforeQty + input.quantity);
      } else {
        afterQty = beforeQty + input.quantity;
      }
      if (afterQty < 0) {
        throw new BadRequestError(ErrorCodes.INSUFFICIENT_STOCK, 'Insufficient stock');
      }

      if (inv) {
        inv = await tx.inventory.update({
          where: { id: inv.id },
          data: { quantity: afterQty },
        });
      } else {
        inv = await tx.inventory.create({
          data: {
            productId: input.productId,
            variantId: input.variantId ?? null,
            warehouseId,
            quantity: afterQty,
            lowStockThreshold:
              (await this.getLowStockThreshold(input.productId)) ?? 5,
          },
        });
      }

      await tx.inventoryTransaction.create({
        data: {
          inventoryId: inv.id,
          type,
          quantity: input.quantity,
          beforeQty,
          afterQty,
          reason: input.reason ?? null,
          createdById: input.actorId ?? null,
        },
      });

      return inv;
    });
  }

  async list(query: { page?: number; limit?: number; warehouseId?: string; lowStock?: boolean }) {
    const { page, limit, skip, take } = paginate(query);
    const where: Record<string, unknown> = {};
    if (query.warehouseId) where.warehouseId = query.warehouseId;
    if (query.lowStock) {
      where.AND = [
        { quantity: { lte: this.prisma.inventory.fields.lowStockThreshold } },
      ];
    }
    const [total, items] = await this.prisma.$transaction([
      this.prisma.inventory.count({ where: where as never }),
      this.prisma.inventory.findMany({
        where: where as never,
        orderBy: { updatedAt: 'desc' },
        skip,
        take,
        include: { product: true, warehouse: true, variant: true },
      }),
    ]);
    return { items, meta: buildPaginationMeta(total, page, limit) };
  }

  async listTransactions(query: { page?: number; limit?: number; productId?: string }) {
    const { page, limit, skip, take } = paginate(query);
    const where: Record<string, unknown> = {};
    if (query.productId) where.inventory = { productId: query.productId };
    const [total, items] = await this.prisma.$transaction([
      this.prisma.inventoryTransaction.count({ where: where as never }),
      this.prisma.inventoryTransaction.findMany({
        where: where as never,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { inventory: { include: { product: true, warehouse: true } }, createdBy: { select: { email: true } } },
      }),
    ]);
    return { items, meta: buildPaginationMeta(total, page, limit) };
  }

  async getStock(productId: string) {
    const items = await this.prisma.inventory.findMany({
      where: { productId, OR: [{ quantity: { gt: 0 } }, { reserved: { gt: 0 } }] },
      include: { warehouse: true },
    });
    const total = items.reduce((s, i) => s + i.quantity, 0);
    const reserved = items.reduce((s, i) => s + i.reserved, 0);
    return { total, reserved, available: total - reserved, items };
  }

  private async getLowStockThreshold(productId: string): Promise<number | null> {
    const setting = await this.prisma.siteSettings.findUnique({
      where: { key: 'inventory.lowStockThreshold' },
    });
    const threshold = (setting?.value as number | undefined) ?? 5;
    const inv = await this.prisma.inventory.findFirst({
      where: { productId },
      select: { lowStockThreshold: true },
    });
    return inv?.lowStockThreshold ?? threshold;
  }
}
