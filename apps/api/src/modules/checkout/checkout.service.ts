import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PricingService } from '../../common/services/pricing.service';
import { OrdersService } from '../orders/orders.service';
import { BadRequestError, NotFoundError, ErrorCodes } from '../../common/errors/app-error';
import type { CheckoutInput } from '@mesi/validation';

@Injectable()
export class CheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: PricingService,
    private readonly ordersService: OrdersService,
  ) {}

  async begin(
    input: CheckoutInput,
    userId: string | undefined,
    sessionKey: string | undefined,
  ) {
    const cart = await this.getCartWithItems(userId, sessionKey);
    if (!cart || cart.items.length === 0) {
      throw new BadRequestError(ErrorCodes.CART_EMPTY, 'Your cart is empty');
    }

    // Validate stock & collect lines from DB (authoritative prices)
    const lines: {
      productId: string;
      variantId: string | null;
      productName: string;
      variantLabel: string | null;
      imageUrl: string | null;
      unitPrice: number;
      quantity: number;
      categoryIds: string[];
    }[] = [];

    for (const item of cart.items) {
      const variant = item.variant ?? (await this.prisma.productVariant.findFirst({
        where: { productId: item.productId },
        include: { product: true },
      }));
      if (!variant) {
        throw new BadRequestError('PRODUCT_UNAVAILABLE', 'A product in your cart is unavailable');
      }
      const available = variant.stock;
      if (item.quantity > available) {
        throw new BadRequestError(
          ErrorCodes.INSUFFICIENT_STOCK,
          `Only ${available} unit(s) of ${variant.product.name} available`,
        );
      }
      const attrs = (variant.attributes ?? {}) as Record<string, string>;
      const variantLabel = Object.keys(attrs).length
        ? Object.values(attrs).join(' / ')
        : null;
      lines.push({
        productId: item.productId,
        variantId: variant.id,
        productName: variant.product.name,
        variantLabel,
        imageUrl: item.product.images[0]?.url ?? null,
        unitPrice: variant.salePrice ?? variant.price,
        quantity: item.quantity,
        categoryIds: item.product.categories.map((c) => c.categoryId),
      });
    }

    // Resolve shipping method
    let shippingMethodId = input.shippingMethodId ?? null;
    if (shippingMethodId) {
      const method = await this.prisma.shippingMethod.findUnique({
        where: { id: shippingMethodId },
      });
      if (!method || !method.isActive) {
        throw new NotFoundError('SHIPPING_METHOD_NOT_FOUND', 'Shipping method not found');
      }
    }

    // Coupon
    const couponCode = input.couponCode ?? cart.couponCode ?? null;
    let couponId: string | null = null;
    if (couponCode) {
      const coupon = await this.prisma.coupon.findUnique({ where: { code: couponCode } });
      if (!coupon || !coupon.isActive) {
        throw new BadRequestError(ErrorCodes.COUPON_INVALID, 'Coupon is invalid');
      }
      couponId = coupon.id;
    }

    const totals = await this.pricing.calculateTotals({
      lines: lines.map(({ unitPrice, quantity, categoryIds, productId }) => ({
        unitPrice,
        quantity,
        categoryIds,
        productId,
      })),
      couponId,
      couponInput: couponCode ? { couponCode } : null,
      shippingMethodId: shippingMethodId as string | null,
    });

    // Resolve customer info
    const user = userId
      ? await this.prisma.user.findUnique({ where: { id: userId } })
      : null;
    const customer = {
      email: user?.email ?? input.shippingAddress?.phone ?? '',
      firstName: user?.firstName ?? input.shippingAddress?.firstName ?? '',
      lastName: user?.lastName ?? input.shippingAddress?.lastName ?? '',
      phone: user?.phone ?? input.shippingAddress?.phone ?? null,
    };

    if (!customer.email || !customer.firstName) {
      throw new BadRequestError(
        'CUSTOMER_INFO_REQUIRED',
        'Customer contact information is required',
      );
    }

    const order = await this.ordersService.createOrder({
      userId: userId ?? null,
      customer,
      shippingAddressId: input.shippingAddressId ?? null,
      shippingAddress: input.shippingAddress ?? null,
      shippingMethodId: shippingMethodId as string | null,
      couponCode,
      notes: input.notes ?? null,
      lines: lines.map(({ productId, variantId, productName, variantLabel, imageUrl, unitPrice, quantity }) => ({
        productId,
        variantId,
        productName,
        variantLabel,
        imageUrl,
        unitPrice,
        quantity,
      })),
      totals: {
        subtotal: totals.subtotal,
        discount: totals.discount,
        shipping: totals.shipping,
        tax: totals.tax,
        total: totals.total,
        currency: process.env.STORE_CURRENCY ?? 'NGN',
      },
    });

    // Clear cart
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    await this.prisma.cart.update({
      where: { id: cart.id },
      data: { couponCode: null, abandonedAt: null },
    });

    return this.ordersService.toDto(
      order as never as Parameters<typeof this.ordersService.toDto>[0],
    );
  }

  async getShippingMethods() {
    return this.prisma.shippingMethod.findMany({
      where: { isActive: true },
      orderBy: [{ position: 'asc' }, { price: 'asc' }],
      include: { zone: true },
    });
  }

  private async getCartWithItems(userId?: string, sessionKey?: string) {
    if (userId) {
      const userCart = await this.prisma.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              product: { include: { images: true, categories: true } },
              variant: { include: { product: true } },
            },
          },
        },
      });
      if (userCart) return userCart;
    }
    if (sessionKey) {
      const guestCart = await this.prisma.cart.findUnique({
        where: { sessionKey },
        include: {
          items: {
            include: {
              product: { include: { images: true, categories: true } },
              variant: { include: { product: true } },
            },
          },
        },
      });
      if (guestCart) return guestCart;
    }
    return null;
  }
}
