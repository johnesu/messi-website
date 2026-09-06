import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotFoundError } from '../../common/errors/app-error';
import { paginate, buildPaginationMeta } from '../../common/utils/pagination';

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: { page?: number; limit?: number; isActive?: string }) {
    const { page, limit, skip, take } = paginate(query);
    const where: Record<string, unknown> = {};
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';
    const [total, items] = await this.prisma.$transaction([
      this.prisma.coupon.count({ where: where as never }),
      this.prisma.coupon.findMany({
        where: where as never,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { _count: { select: { usage: true } } },
      }),
    ]);
    return { items, meta: buildPaginationMeta(total, page, limit) };
  }

  async create(input: {
    code: string;
    type: 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING';
    value: number;
    minOrderAmount?: number;
    maxDiscountAmount?: number;
    usageLimit?: number;
    perCustomerLimit?: number;
    startsAt?: string;
    expiresAt?: string;
    appliesTo?: string;
    isActive?: boolean;
    productIds?: string[];
    categoryIds?: string[];
  }) {
    return this.prisma.coupon.create({
      data: {
        code: input.code.toUpperCase(),
        type: input.type,
        value: input.value,
        minOrderAmount: input.minOrderAmount ?? null,
        maxDiscountAmount: input.maxDiscountAmount ?? null,
        usageLimit: input.usageLimit ?? null,
        perCustomerLimit: input.perCustomerLimit ?? null,
        startsAt: input.startsAt ? new Date(input.startsAt) : null,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        appliesTo: input.appliesTo ?? 'all',
        isActive: input.isActive ?? true,
        products: input.productIds?.length
          ? { create: input.productIds.map((productId) => ({ productId })) }
          : undefined,
        categories: input.categoryIds?.length
          ? { create: input.categoryIds.map((categoryId) => ({ categoryId })) }
          : undefined,
      },
    });
  }

  async update(
    id: string,
    input: Partial<{
      code: string;
      type: 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING';
      value: number;
      minOrderAmount: number;
      maxDiscountAmount: number;
      usageLimit: number;
      startsAt: string;
      expiresAt: string;
      isActive: boolean;
    }>,
  ) {
    await this.ensureExists(id);
    const data: Record<string, unknown> = {};
    if (input.code !== undefined) data.code = input.code.toUpperCase();
    if (input.type !== undefined) data.type = input.type;
    if (input.value !== undefined) data.value = input.value;
    if (input.minOrderAmount !== undefined) data.minOrderAmount = input.minOrderAmount;
    if (input.maxDiscountAmount !== undefined) data.maxDiscountAmount = input.maxDiscountAmount;
    if (input.usageLimit !== undefined) data.usageLimit = input.usageLimit;
    if (input.startsAt !== undefined) data.startsAt = input.startsAt ? new Date(input.startsAt) : null;
    if (input.expiresAt !== undefined) data.expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
    if (input.isActive !== undefined) data.isActive = input.isActive;
    return this.prisma.coupon.update({ where: { id }, data: data as never });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.coupon.delete({ where: { id } });
    return { id };
  }

  private async ensureExists(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundError('COUPON_NOT_FOUND', 'Coupon not found');
    return coupon;
  }
}
