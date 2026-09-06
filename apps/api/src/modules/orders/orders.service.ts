import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../common/errors/app-error';
import { paginate, buildPaginationMeta } from '../../common/utils/pagination';
import { generateOrderNumber, generateInvoiceNumber } from '../../common/utils/order.util';
import type { OrderDto, AddressDto, OrderItemDto } from '@mesi/types';

export interface CreateOrderParams {
  userId?: string | null;
  customer: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
  };
  shippingAddressId?: string | null;
  shippingAddress?: {
    firstName: string;
    lastName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    state: string;
    postalCode?: string | null;
    country?: string;
  } | null;
  shippingMethodId?: string | null;
  couponCode?: string | null;
  notes?: string | null;
  lines: {
    productId: string;
    variantId: string | null;
    productName: string;
    variantLabel: string | null;
    imageUrl: string | null;
    unitPrice: number;
    quantity: number;
  }[];
  totals: {
    subtotal: number;
    discount: number;
    shipping: number;
    tax: number;
    total: number;
    currency: string;
  };
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async createOrder(params: CreateOrderParams) {
    const orderNumber = generateOrderNumber();
    const invoiceNumber = generateInvoiceNumber(orderNumber);

    let shippingAddressRecord: { id: string } | null = null;

    if (params.shippingAddress) {
      shippingAddressRecord = await this.prisma.address.create({
        data: {
          userId: params.userId ?? null,
          firstName: params.shippingAddress.firstName,
          lastName: params.shippingAddress.lastName,
          phone: params.shippingAddress.phone,
          addressLine1: params.shippingAddress.addressLine1,
          addressLine2: params.shippingAddress.addressLine2 ?? null,
          city: params.shippingAddress.city,
          state: params.shippingAddress.state,
          postalCode: params.shippingAddress.postalCode ?? null,
          country: params.shippingAddress.country ?? 'Nigeria',
        },
      });
    } else if (params.shippingAddressId) {
      const addr = await this.prisma.address.findUnique({
        where: { id: params.shippingAddressId },
      });
      if (addr) shippingAddressRecord = addr;
    }

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        invoiceNumber,
        userId: params.userId ?? null,
        customerEmail: params.customer.email,
        customerFirstName: params.customer.firstName,
        customerLastName: params.customer.lastName,
        customerPhone: params.customer.phone ?? null,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        fulfillmentStatus: 'UNFULFILLED',
        currency: params.totals.currency,
        subtotal: params.totals.subtotal,
        discount: params.totals.discount,
        shipping: params.totals.shipping,
        tax: params.totals.tax,
        total: params.totals.total,
        couponCode: params.couponCode ?? null,
        notes: params.notes ?? null,
        shippingAddressId: shippingAddressRecord?.id ?? null,
        shippingMethodId: params.shippingMethodId ?? null,
        items: {
          create: params.lines.map((l) => ({
            productId: l.productId,
            variantId: l.variantId,
            productName: l.productName,
            variantLabel: l.variantLabel,
            imageUrl: l.imageUrl,
            unitPrice: l.unitPrice,
            quantity: l.quantity,
            lineTotal: l.unitPrice * l.quantity,
          })),
        },
        statusHistory: {
          create: {
            fromStatus: null,
            toStatus: 'PENDING',
            note: 'Order created',
          },
        },
      },
      include: { items: true, shippingAddress: true },
    });

    // Record coupon usage
    if (params.couponCode) {
      const coupon = await this.prisma.coupon.findUnique({ where: { code: params.couponCode } });
      if (coupon) {
        await this.prisma.$transaction([
          this.prisma.couponUsage.create({
            data: {
              couponId: coupon.id,
              userId: params.userId ?? null,
              orderId: order.id,
            },
          }),
          this.prisma.coupon.update({
            where: { id: coupon.id },
            data: { usedCount: { increment: 1 } },
          }),
        ]);
      }
    }

    return order;
  }

  async findByUser(
    userId: string,
    query: { page?: number; limit?: number },
    actorId: string,
  ) {
    if (userId !== actorId) {
      // Only allow users to see their own orders (unless admin via other route)
      throw new ForbiddenError();
    }
    const { page, limit, skip, take } = paginate(query);
    const where = { userId };
    const [total, orders] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { items: true, shippingAddress: true },
      }),
    ]);
    return {
      items: orders.map((o) => this.toDto(o as never)),
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    status?: string;
    q?: string;
    from?: string;
    to?: string;
  }) {
    const { page, limit, skip, take } = paginate(query);
    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.q) {
      where.OR = [
        { orderNumber: { contains: query.q } },
        { customerEmail: { contains: query.q, mode: 'insensitive' } },
        { customerFirstName: { contains: query.q, mode: 'insensitive' } },
        { customerLastName: { contains: query.q, mode: 'insensitive' } },
      ];
    }
    if (query.from || query.to) {
      const gte = query.from ? new Date(query.from) : undefined;
      const lte = query.to ? new Date(query.to) : undefined;
      where.createdAt = { ...(gte ? { gte } : {}), ...(lte ? { lte } : {}) };
    }
    const [total, orders] = await this.prisma.$transaction([
      this.prisma.order.count({ where: where as never }),
      this.prisma.order.findMany({
        where: where as never,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { items: true, shippingAddress: true, payments: true, shipments: true },
      }),
    ]);
    return {
      items: orders.map((o) => this.toDto(o as never)),
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async findByIdForUser(id: string, actorId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, shippingAddress: true, statusHistory: { orderBy: { createdAt: 'desc' } } },
    });
    if (!order) throw new NotFoundError('ORDER_NOT_FOUND', 'Order not found');
    if (order.userId && order.userId !== actorId) throw new ForbiddenError();
    return this.toDto(order as never);
  }

  async findByIdAdmin(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        shippingAddress: true,
        payments: true,
        refunds: true,
        shipments: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!order) throw new NotFoundError('ORDER_NOT_FOUND', 'Order not found');
    return this.toDto(order as never);
  }

  async updateStatus(
    id: string,
    status: string,
    actorId: string,
    note?: string,
    req?: unknown,
  ) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundError('ORDER_NOT_FOUND', 'Order not found');
    if (order.status === status) return this.findByIdAdmin(id);

    const updated = await this.prisma.$transaction(async (tx) => {
      const o = await tx.order.update({
        where: { id },
        data: { status: status as never },
        include: { items: true },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          fromStatus: order.status as never,
          toStatus: status as never,
          note,
          changedById: actorId ?? null,
        },
      });
      return o;
    });

    await this.audit.log(
      {
        actorId,
        action: 'order.status_change',
        resource: 'order',
        resourceId: id,
        metadata: { from: order.status, to: status, note },
      },
      req as never,
    );

    return this.findByIdAdmin(id);
  }

  async getInvoice(id: string, actorId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, shippingAddress: true, payments: true },
    });
    if (!order) throw new NotFoundError('ORDER_NOT_FOUND', 'Order not found');
    if (actorId && order.userId && order.userId !== actorId) throw new ForbiddenError();
    return order;
  }

  toDto(o: {
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    currency: string;
    subtotal: number;
    discount: number;
    shipping: number;
    tax: number;
    total: number;
    createdAt: Date;
    updatedAt: Date;
    customerEmail: string;
    customerFirstName: string;
    customerLastName: string;
    customerPhone: string | null;
    items: {
      id: string;
      productId: string;
      variantId: string | null;
      productName: string;
      variantLabel: string | null;
      unitPrice: number;
      quantity: number;
      lineTotal: number;
      imageUrl: string | null;
    }[];
    shippingAddress: {
      id: string;
      firstName: string;
      lastName: string;
      phone: string;
      addressLine1: string;
      addressLine2: string | null;
      city: string;
      state: string;
      postalCode: string | null;
      country: string;
    } | null;
  }): OrderDto {
    const items: OrderItemDto[] = o.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      productName: i.productName,
      variantId: i.variantId,
      variantLabel: i.variantLabel,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      lineTotal: i.lineTotal,
      imageUrl: i.imageUrl,
    }));
    const shippingAddress: AddressDto | null = o.shippingAddress
      ? {
          id: o.shippingAddress.id,
          firstName: o.shippingAddress.firstName,
          lastName: o.shippingAddress.lastName,
          phone: o.shippingAddress.phone,
          addressLine1: o.shippingAddress.addressLine1,
          addressLine2: o.shippingAddress.addressLine2,
          city: o.shippingAddress.city,
          state: o.shippingAddress.state,
          postalCode: o.shippingAddress.postalCode,
          country: o.shippingAddress.country,
          isDefault: false,
        }
      : null;

    return {
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status as OrderDto['status'],
      paymentStatus: o.paymentStatus as OrderDto['paymentStatus'],
      items,
      subtotal: o.subtotal,
      discount: o.discount,
      shipping: o.shipping,
      tax: o.tax,
      total: o.total,
      currency: o.currency,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
      customer: {
        email: o.customerEmail,
        firstName: o.customerFirstName,
        lastName: o.customerLastName,
        phone: o.customerPhone,
      },
      shippingAddress,
    };
  }
}
