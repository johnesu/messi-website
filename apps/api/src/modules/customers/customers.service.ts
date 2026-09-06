import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotFoundError } from '../../common/errors/app-error';
import { paginate, buildPaginationMeta } from '../../common/utils/pagination';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: {
    page?: number;
    limit?: number;
    segment?: string;
    q?: string;
    tier?: string;
  }) {
    const { page, limit, skip, take } = paginate(query);
    const where: Record<string, unknown> = {};
    if (query.segment) where.segment = query.segment;
    if (query.tier) where.tier = query.tier;
    if (query.q) {
      where.user = {
        OR: [
          { email: { contains: query.q, mode: 'insensitive' } },
          { firstName: { contains: query.q, mode: 'insensitive' } },
          { lastName: { contains: query.q, mode: 'insensitive' } },
        ],
      };
    }
    const [total, customers] = await this.prisma.$transaction([
      this.prisma.customer.count({ where: where as never }),
      this.prisma.customer.findMany({
        where: where as never,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          user: { select: { email: true, firstName: true, lastName: true, phone: true, imageUrl: true } },
          _count: { select: { referralsMade: true } },
        },
      }),
    ]);
    return { items: customers, meta: buildPaginationMeta(total, page, limit) };
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, firstName: true, lastName: true, phone: true } },
        loyaltyAccount: true,
        referralsMade: { include: { referred: { include: { user: { select: { email: true, firstName: true, lastName: true } } } } } },
      },
    });
    if (!customer) throw new NotFoundError('CUSTOMER_NOT_FOUND', 'Customer not found');

    const orders = await this.prisma.order.findMany({
      where: { userId: customer.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { items: true },
    });

    const addresses = await this.prisma.address.findMany({ where: { userId: customer.userId } });
    const reviews = await this.prisma.review.findMany({
      where: { userId: customer.userId },
      include: { product: { select: { id: true, name: true, slug: true } } },
    });

    return {
      ...customer,
      orders,
      addresses,
      reviews,
      totalSpentDisplay: customer.totalSpent,
    };
  }

  async update(id: string, input: Partial<{ tier: string; segment: string; notes: string; tags: string[] }>) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundError('CUSTOMER_NOT_FOUND', 'Customer not found');
    const data: Record<string, unknown> = {};
    if (input.tier !== undefined) data.tier = input.tier;
    if (input.segment !== undefined) data.segment = input.segment;
    if (input.notes !== undefined) data.notes = input.notes;
    if (input.tags !== undefined) data.tags = input.tags;
    return this.prisma.customer.update({ where: { id }, data: data as never });
  }

  async computeSegments() {
    const customers = await this.prisma.customer.findMany({
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });
    const updates: Record<string, string> = {};
    for (const c of customers) {
      let segment = 'NEW_CUSTOMER';
      if (c.orderCount > 0) {
        if (c.totalSpent >= 5000000) segment = 'VIP';
        else if (c.totalSpent >= 1000000) segment = 'HIGH_VALUE';
        else if (c.orderCount > 3) segment = 'RETURNING';
        else segment = 'RETURNING';
      }
      const daysSinceLast = c.lastPurchaseAt
        ? (Date.now() - c.lastPurchaseAt.getTime()) / 86400000
        : Infinity;
      if (c.orderCount > 0 && daysSinceLast > 180) segment = 'INACTIVE';
      updates[c.id] = segment;
    }
    for (const [cid, segment] of Object.entries(updates)) {
      await this.prisma.customer.update({
        where: { id: cid },
        data: { segment },
      });
    }
    return { updated: Object.keys(updates).length };
  }
}
