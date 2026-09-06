import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { InventoryService } from '../inventory/inventory.service';
import { EmailService } from '../email/email.service';
import { AuditService } from '../audit/audit.service';
import { PaystackProvider } from './paystack.provider';
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
  ErrorCodes,
} from '../../common/errors/app-error';
import { paginate, buildPaginationMeta } from '../../common/utils/pagination';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
    private readonly inventoryService: InventoryService,
    private readonly emailService: EmailService,
    private readonly audit: AuditService,
    private readonly provider: PaystackProvider,
  ) {}

  async initialize(orderId: string, userId?: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundError('ORDER_NOT_FOUND', 'Order not found');
    if (order.userId && userId !== undefined && order.userId !== userId) {
      throw new ForbiddenError();
    }
    if (order.paymentStatus === 'SUCCESSFUL') {
      throw new BadRequestError(
        ErrorCodes.PAYMENT_ALREADY_PROCESSED,
        'This order has already been paid',
      );
    }

    const reference = `PAY-${randomBytes(12).toString('hex').toUpperCase()}`;
    const payment = await this.prisma.payment.create({
      data: {
        orderId: order.id,
        reference,
        provider: this.provider.name,
        amount: order.total,
        currency: order.currency,
        status: 'INITIALIZED',
      },
    });

    let result;
    try {
      result = await this.provider.initialize({
        amount: order.total,
        currency: order.currency,
        email: order.customerEmail,
        reference,
        metadata: { orderId: order.id, orderNumber: order.orderNumber },
      });
    } catch {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });
      throw new BadRequestError(ErrorCodes.PAYMENT_FAILED, 'Unable to initialize payment');
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { providerReference: result.providerReference ?? null },
    });
    await this.prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: 'INITIALIZED' },
    });

    await this.audit.log({
      actorId: userId ?? null,
      action: 'payment.initialize',
      resource: 'order',
      resourceId: order.id,
      metadata: { reference, provider: this.provider.name },
    });

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      reference,
      authorizationUrl: result.authorizationUrl,
      provider: this.provider.name,
    };
  }

  /**
   * Verify a transaction and confirm the order. Idempotent — safe to call
   * multiple times (e.g. duplicate webhooks).
   */
  async verifyAndConfirm(reference: string): Promise<{
    orderId: string;
    status: string;
  }> {
    const payment = await this.prisma.payment.findUnique({
      where: { reference },
      include: { order: { include: { items: true } } },
    });
    if (!payment) throw new NotFoundError('PAYMENT_NOT_FOUND', 'Payment not found');

    // Idempotency guard: already finalized
    if (payment.status === 'SUCCESSFUL') {
      return { orderId: payment.orderId, status: 'SUCCESSFUL' };
    }

    const result = await this.provider.verify(reference);

    if (result.status === 'success') {
      await this.confirmOrder(payment.order, payment.id, result.paidAt);
      return { orderId: payment.orderId, status: 'SUCCESSFUL' };
    }

    const finalStatus =
      result.status === 'cancelled'
        ? 'CANCELLED'
        : result.status === 'failed'
          ? 'FAILED'
          : 'PENDING';
    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: finalStatus as never },
      }),
      this.prisma.order.update({
        where: { id: payment.orderId },
        data: { paymentStatus: finalStatus as never },
      }),
    ]);
    return { orderId: payment.orderId, status: result.status };
  }

  async handleWebhook(payload: unknown, signature?: string) {
    // Webhook signature validation (HMAC SHA512 per Paystack spec); sandbox skips.
    const secretKey = process.env.PAYSTACK_SECRET_KEY ?? '';
    if (secretKey && !signature) {
      throw new BadRequestError(
        ErrorCodes.INVALID_WEBHOOK_SIGNATURE,
        'Missing webhook signature',
      );
    }
    if (secretKey && signature) {
      const { createHmac } = await import('crypto');
      const expected = createHmac('sha512', secretKey)
        .update(JSON.stringify(payload))
        .digest('hex');
      if (expected !== signature) {
        throw new BadRequestError(
          ErrorCodes.INVALID_WEBHOOK_SIGNATURE,
          'Invalid webhook signature',
        );
      }
    }

    const data = payload as {
      event?: string;
      data?: { reference?: string };
    };
    const reference = data?.data?.reference;
    if (!reference) return { received: true };

    const event = data.event ?? 'charge.success';
    if (event === 'charge.success') {
      await this.verifyAndConfirm(reference);
    }
    return { received: true };
  }

  async refund(params: {
    orderId: string;
    amount?: number;
    reason?: string;
    actorId?: string;
    req?: unknown;
  }) {
    const order = await this.prisma.order.findUnique({
      where: { id: params.orderId },
      include: { payments: true },
    });
    if (!order) throw new NotFoundError('ORDER_NOT_FOUND', 'Order not found');

    const successfulPayment = order.payments.find((p) => p.status === 'SUCCESSFUL');
    if (!successfulPayment) {
      throw new BadRequestError('NO_SUCCESSFUL_PAYMENT', 'No successful payment to refund');
    }

    const refundAmount = Math.min(params.amount ?? order.total, order.total);

    let providerRefundId: string;
    try {
      const result = await this.provider.refund({
        reference: successfulPayment.reference,
        amount: refundAmount,
        reason: params.reason,
      });
      providerRefundId = result.providerRefundId;
    } catch {
      throw new BadRequestError('REFUND_FAILED', 'Refund could not be processed');
    }

    const refund = await this.prisma.refund.create({
      data: {
        paymentId: successfulPayment.id,
        orderId: order.id,
        amount: refundAmount,
        reason: params.reason ?? null,
        status: 'SUCCESSFUL',
        providerRefundId,
        initiatedById: params.actorId ?? null,
      },
    });

    const refunds = await this.prisma.refund.aggregate({
      where: { orderId: order.id, status: 'SUCCESSFUL' },
      _sum: { amount: true },
    });
    const refundedTotal = refunds._sum.amount ?? 0;
    const orderStatus =
      refundedTotal >= order.total ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
    const paymentStatus =
      refundedTotal >= order.total ? 'REFUNDED' : 'PARTIALLY_REFUNDED';

    await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: order.id },
        data: { status: orderStatus as never, paymentStatus: paymentStatus as never },
      }),
      this.prisma.payment.update({
        where: { id: successfulPayment.id },
        data: { status: paymentStatus as never },
      }),
      this.prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: 'PAID' as never,
          toStatus: orderStatus as never,
          note: params.reason ?? 'Refund processed',
          changedById: params.actorId ?? null,
        },
      }),
    ]);

    // Return stock for refunded items
    // (A full production flow would restore inventory here.)
    await this.emailService.send({
      to: order.customerEmail,
      subject: `Refund confirmation for ${order.orderNumber}`,
      html: `<p>Your refund of ${order.currency} ${(refundAmount / 100).toFixed(2)} has been processed.</p>`,
    });

    await this.audit.log(
      {
        actorId: params.actorId ?? null,
        action: 'payment.refund',
        resource: 'order',
        resourceId: order.id,
        metadata: { amount: refundAmount, reason: params.reason, refundId: refund.id },
      },
      params.req as never,
    );

    return refund;
  }

  async listTransactions(query: { page?: number; limit?: number; status?: string }) {
    const { page, limit, skip, take } = paginate(query);
    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    const [total, items] = await this.prisma.$transaction([
      this.prisma.payment.count({ where: where as never }),
      this.prisma.payment.findMany({
        where: where as never,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { order: { select: { orderNumber: true, customerEmail: true } } },
      }),
    ]);
    return { items, meta: buildPaginationMeta(total, page, limit) };
  }

  private async confirmOrder(
    order: { id: string; items: unknown[]; orderNumber: string; customerEmail: string; total: number; currency: string },
    paymentId: string,
    paidAt?: Date,
  ) {
    // Idempotency: only finalize once
    await this.prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({ where: { id: order.id } });
      if (current!.paymentStatus === 'SUCCESSFUL') return;

      await tx.payment.update({
        where: { id: paymentId },
        data: { status: 'SUCCESSFUL', paidAt: paidAt ?? new Date() },
      });
      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'SUCCESSFUL',
          status: current!.status === 'PENDING' ? 'PAID' : current!.status,
        },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          toStatus: (current!.status === 'PENDING' ? 'PAID' : current!.status) as never,
          note: 'Payment confirmed',
        },
      });

      // Update customer stats
      const userId = current!.userId;
      if (userId) {
        const customer = await tx.customer.findUnique({ where: { userId } });
        if (customer) {
          await tx.customer.update({
            where: { userId },
            data: {
              orderCount: { increment: 1 },
              totalSpent: { increment: current!.total },
              lastPurchaseAt: new Date(),
            },
          });
          await tx.loyaltyAccount.upsert({
            where: { customerId: customer.id },
            update: {
              points: { increment: Math.floor(current!.total / 100 * 0.1) },
              lifetimePoints: { increment: Math.floor(current!.total / 100 * 0.1) },
            },
            create: {
              customerId: customer.id,
              points: Math.floor(current!.total / 100 * 0.1),
              lifetimePoints: Math.floor(current!.total / 100 * 0.1),
            },
          });
        }
      }
    });

    // Decrement inventory (separate transaction; guarded by order payment status)
    const orderState = await this.prisma.order.findUnique({ where: { id: order.id } });
    if (orderState && orderState.fulfillmentStatus === 'UNFULFILLED') {
      await this.inventoryService.decrementForSale(order.id);
    }

    // Notifications
    const items = order.items as { productName: string; quantity: number; lineTotal: number }[];
    await this.emailService.sendOrderConfirmation({
      customerEmail: order.customerEmail,
      customerFirstName: order.customerEmail,
      orderNumber: order.orderNumber,
      total: order.total,
      currency: order.currency,
      items: items.map((i) => ({ name: i.productName, qty: i.quantity, lineTotal: i.lineTotal })),
    });

    const orderWithUser = await this.prisma.order.findUnique({ where: { id: order.id } });
    if (orderWithUser?.userId) {
      await this.prisma.notification.create({
        data: {
          userId: orderWithUser.userId,
          type: 'order.confirmed',
          title: 'Payment confirmed',
          body: `Your order ${order.orderNumber} has been confirmed.`,
          channel: 'IN_APP',
          status: 'SENT',
          data: { orderId: order.id } as never,
        },
      });
    }
  }
}
