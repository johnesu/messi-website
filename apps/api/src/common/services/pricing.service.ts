import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface PricingLine {
  productId: string;
  unitPrice: number;
  quantity: number;
  categoryIds: string[];
}

export interface PricingResult {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  itemCount: number;
  couponApplied: boolean;
  shippingMethodId?: string | null;
}

@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateTotals(params: {
    lines: PricingLine[];
    couponId?: string | null;
    shippingMethodId?: string | null;
    couponInput?: { couponCode: string } | null;
  }): Promise<PricingResult> {
    const subtotal = params.lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
    const itemCount = params.lines.reduce((sum, l) => sum + l.quantity, 0);

    // Coupon
    let discount = 0;
    let couponApplied = false;
    if (params.couponId && params.couponInput?.couponCode) {
      const coupon = await this.prisma.coupon.findUnique({
        where: { id: params.couponId },
        include: { products: true, categories: true },
      });
      if (coupon && coupon.isActive && this.isCouponActive(coupon)) {
        discount = this.computeCouponDiscount(coupon, params.lines, subtotal);
        couponApplied = discount > 0;
        this.assertMinOrder(subtotal, discount, coupon);
      }
    }

    // Shipping
    let shipping = 0;
    if (params.shippingMethodId) {
      const method = await this.prisma.shippingMethod.findUnique({
        where: { id: params.shippingMethodId },
      });
      if (method && method.isActive) {
        shipping =
          method.freeShippingThreshold !== null && subtotal - discount >= method.freeShippingThreshold
            ? 0
            : method.price;
      }
    }

    // Tax (from settings)
    const taxRate = await this.getTaxRate();
    const taxableBase = Math.max(0, subtotal - discount);
    const tax = Math.round(taxableBase * taxRate);

    const total = Math.max(0, taxableBase + shipping + tax);

    return {
      subtotal,
      discount,
      shipping,
      tax,
      total,
      itemCount,
      couponApplied,
      shippingMethodId: params.shippingMethodId ?? null,
    };
  }

  private isCouponActive(coupon: {
    startsAt: Date | null;
    expiresAt: Date | null;
    usageLimit: number | null;
    usedCount: number;
  }): boolean {
    const now = new Date();
    if (coupon.startsAt && now < coupon.startsAt) return false;
    if (coupon.expiresAt && now > coupon.expiresAt) return false;
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) return false;
    return true;
  }

  private assertMinOrder(
    subtotal: number,
    discount: number,
    coupon: { minOrderAmount: number | null },
  ) {
    if (coupon.minOrderAmount !== null && subtotal < coupon.minOrderAmount) {
      throw new Error('MINIMUM_ORDER_NOT_MET');
    }
  }

  private computeCouponDiscount(
    coupon: {
      type: 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING';
      value: number;
      maxDiscountAmount: number | null;
      appliesTo: string | null;
      categoryIds?: never;
      categories: { categoryId: string }[];
      products: { productId: string }[];
    },
    lines: PricingLine[],
    subtotal: number,
  ): number {
    if (coupon.type === 'FREE_SHIPPING') return 0;

    let eligibleLines = lines;
    if (coupon.appliesTo === 'products') {
      const productIds = new Set(coupon.products.map((p) => p.productId));
      eligibleLines = lines.filter((l) => productIds.has(l.productId));
    } else if (coupon.appliesTo === 'categories') {
      const categoryIds = new Set(coupon.categories.map((c) => c.categoryId));
      eligibleLines = lines.filter((l) =>
        l.categoryIds.some((cid) => categoryIds.has(cid)),
      );
    }

    const eligibleSubtotal = eligibleLines.reduce(
      (sum, l) => sum + l.unitPrice * l.quantity,
      0,
    );

    let discount = 0;
    if (coupon.type === 'PERCENTAGE') {
      discount = Math.round((eligibleSubtotal * coupon.value) / 100);
      if (coupon.maxDiscountAmount !== null) {
        discount = Math.min(discount, coupon.maxDiscountAmount);
      }
    } else if (coupon.type === 'FIXED') {
      discount = Math.min(coupon.value, eligibleSubtotal);
    }

    return Math.min(discount, subtotal);
  }

  private async getTaxRate(): Promise<number> {
    const setting = await this.prisma.siteSettings.findUnique({
      where: { key: 'store.taxRate' },
    });
    const rate = (setting?.value as number | undefined) ?? 0.075;
    return Math.max(0, rate);
  }
}
