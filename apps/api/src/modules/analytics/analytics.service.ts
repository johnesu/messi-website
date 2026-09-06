import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard(range?: { from?: string; to?: string }) {
    const createdAt = this.rangeFilter(range);

    // Paid orders (for revenue)
    const paidWhere = {
      paymentStatus: 'SUCCESSFUL',
      ...(createdAt ? { createdAt } : {}),
    };
    const allWhere = createdAt ? { createdAt } : {};

    const [revenueAgg, orderCount, paidOrderCount, paidOrders, recentOrders] =
      await this.prisma.$transaction([
        this.prisma.order.aggregate({
          where: paidWhere as never,
          _sum: { total: true },
        }),
        this.prisma.order.count({ where: allWhere as never }),
        this.prisma.order.count({ where: paidWhere as never }),
        this.prisma.order.findMany({
          where: paidWhere as never,
          select: { id: true, items: true },
        }),
        this.prisma.order.findMany({
          where: allWhere as never,
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { items: true },
        }),
      ]);

    const customerCount = await this.prisma.customer.count();
    const productCount = await this.prisma.product.count();

    const revenue = revenueAgg._sum.total ?? 0;
    const avgOrderValue = paidOrderCount > 0 ? Math.round(revenue / paidOrderCount) : 0;
    const conversionRate =
      orderCount > 0 ? Math.round((paidOrderCount / orderCount) * 10000) / 100 : 0;

    // Top products from paid orders
    const productSales = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const order of paidOrders) {
      for (const item of order.items as unknown as {
        productName: string;
        quantity: number;
        unitPrice: number;
        lineTotal: number;
      }[]) {
        const cur = productSales.get(item.productName) ?? {
          name: item.productName,
          qty: 0,
          revenue: 0,
        };
        cur.qty += item.quantity;
        cur.revenue += item.lineTotal;
        productSales.set(item.productName, cur);
      }
    }
    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Low stock
    const lowStock = await this.prisma.inventory.findMany({
      where: {
        AND: [
          { quantity: { lte: this.prisma.inventory.fields.lowStockThreshold } },
        ],
      },
      orderBy: { quantity: 'asc' },
      take: 10,
      include: { product: { select: { id: true, name: true, slug: true } }, warehouse: true },
    });

    return {
      revenue,
      orders: orderCount,
      paidOrders: paidOrderCount,
      customers: customerCount,
      products: productCount,
      avgOrderValue,
      conversionRate,
      topProducts,
      lowStock,
      recentOrders,
    };
  }

  async revenueByDay(from?: string, to?: string) {
    const orders = await this.prisma.order.findMany({
      where: {
        paymentStatus: 'SUCCESSFUL',
        createdAt: {
          ...(from ? { gte: new Date(from) } : {}),
          ...(to ? { lte: new Date(to) } : {}),
        },
      },
      select: { total: true, createdAt: true },
    });
    const byDay = new Map<string, number>();
    for (const o of orders) {
      const day = o.createdAt.toISOString().slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + o.total);
    }
    return Array.from(byDay.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async salesByCategory(range?: { from?: string; to?: string }) {
    const orders = await this.prisma.order.findMany({
      where: {
        paymentStatus: 'SUCCESSFUL',
        ...(range ? { createdAt: this.rangeFilter(range) } : {}),
      },
      select: {
        items: {
          select: { productId: true, lineTotal: true, quantity: true },
        },
      },
    });
    const catSales = new Map<string, { name: string; revenue: number; units: number }>();
    const productIds = new Set<string>();
    for (const o of orders) {
      for (const item of o.items as { productId: string; lineTotal: number; quantity: number }[]) {
        productIds.add(item.productId);
      }
    }
    const products = await this.prisma.product.findMany({
      where: { id: { in: Array.from(productIds) } },
      include: { categories: { include: { category: true } } },
    });
    const byProduct = new Map<string, { lineTotal: number; quantity: number }>();
    for (const o of orders) {
      for (const item of o.items as { productId: string; lineTotal: number; quantity: number }[]) {
        const cur = byProduct.get(item.productId) ?? { lineTotal: 0, quantity: 0 };
        cur.lineTotal += item.lineTotal;
        cur.quantity += item.quantity;
        byProduct.set(item.productId, cur);
      }
    }
    for (const p of products) {
      const sales = byProduct.get(p.id);
      if (!sales) continue;
      const catName = p.categories[0]?.category?.name ?? 'Uncategorized';
      const cur = catSales.get(catName) ?? { name: catName, revenue: 0, units: 0 };
      cur.revenue += sales.lineTotal;
      cur.units += sales.quantity;
      catSales.set(catName, cur);
    }
    return Array.from(catSales.values()).sort((a, b) => b.revenue - a.revenue);
  }

  private rangeFilter(range?: { from?: string; to?: string }) {
    if (!range?.from && !range?.to) return undefined;
    return {
      ...(range.from ? { gte: new Date(range.from) } : {}),
      ...(range.to ? { lte: new Date(range.to) } : {}),
    };
  }
}
