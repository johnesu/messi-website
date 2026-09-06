import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PricingService } from '../../common/services/pricing.service';
import { BadRequestError, NotFoundError, ErrorCodes } from '../../common/errors/app-error';
import type { CartDto, ProductDto, CartLineDto } from '@mesi/types';

type CartWithItems = {
  id: string;
  userId: string | null;
  sessionKey: string | null;
  couponCode: string | null;
  items: {
    id: string;
    quantity: number;
    unitPrice: number;
    productId: string;
    variantId: string | null;
    product: {
      id: string;
      name: string;
      slug: string;
      sku: string;
      price: number;
      salePrice: number | null;
      reviewCount: number;
      rating: number;
      status: string;
      featured: boolean;
      seoTitle: string | null;
      seoDescription: string | null;
      createdAt: Date;
      categories: { categoryId: string }[];
      images: { id: string; url: string; alt: string | null; position: number }[];
      variants: {
        id: string;
        sku: string;
        price: number;
        salePrice: number | null;
        stock: number;
        attributes: unknown;
        imageUrl: string | null;
        barcode: string | null;
      }[];
    };
    variant: {
      id: string;
      sku: string;
      price: number;
      salePrice: number | null;
      stock: number;
      attributes: unknown;
      imageUrl: string | null;
      barcode: string | null;
    } | null;
  }[];
};

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: PricingService,
  ) {}

  async getCart(
    userId?: string,
    sessionKey?: string,
    shippingMethodId?: string | null,
  ): Promise<CartDto> {
    const cart = await this.resolveCart(userId, sessionKey);
    if (!cart) return this.emptyCart();
    return this.toCartDto(cart as CartWithItems, shippingMethodId ?? null);
  }

  async addItem(
    userId: string | undefined,
    sessionKey: string | undefined,
    input: { productId?: string | null; variantId?: string | null; quantity: number },
  ) {
    const cart = await this.ensureCart(userId, sessionKey);

    // Resolve product & variant
    let variant = input.variantId
      ? await this.prisma.productVariant.findUnique({
          where: { id: input.variantId },
          include: { product: true },
        })
      : null;

    if (!variant && input.productId) {
      variant =
        (await this.prisma.productVariant.findFirst({
          where: { productId: input.productId, isDefault: true },
          include: { product: true },
        })) ??
        (await this.prisma.productVariant.findFirst({
          where: { productId: input.productId },
          include: { product: true },
        }));
    }

    if (!variant) {
      throw new NotFoundError('VARIANT_NOT_FOUND', 'Product variant not found');
    }
    if (!['ACTIVE', 'OUT_OF_STOCK'].includes(variant.product.status)) {
      throw new BadRequestError('PRODUCT_UNAVAILABLE', 'This product is not available');
    }

    const available = await this.availableStock(variant.productId, variant.id ?? null);

    // Existing quantity in cart for this variant
    const existing = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId_variantId: {
          cartId: cart.id,
          productId: variant.productId,
          variantId: variant.id,
        },
      },
    });
    const currentQty = existing?.quantity ?? 0;
    const requestedQty = currentQty + input.quantity;

    if (available < requestedQty) {
      throw new BadRequestError(
        available > 0 ? ErrorCodes.INSUFFICIENT_STOCK : ErrorCodes.PRODUCT_OUT_OF_STOCK,
        available > 0
          ? `Only ${available} unit(s) available in stock`
          : 'This product is currently out of stock',
      );
    }

    const unitPrice = variant.salePrice ?? variant.price;

    if (existing) {
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: requestedQty, unitPrice },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: variant.productId,
          variantId: variant.id,
          quantity: input.quantity,
          unitPrice,
        },
      });
    }

    // Cart no longer abandoned
    await this.prisma.cart.update({
      where: { id: cart.id },
      data: { abandonedAt: null, reminderSentAt: null },
    });

    return this.getCart(userId, sessionKey);
  }

  async updateItem(
    userId: string | undefined,
    sessionKey: string | undefined,
    itemId: string,
    quantity: number,
  ) {
    const cart = await this.resolveCart(userId, sessionKey);
    if (!cart) throw new NotFoundError('CART_NOT_FOUND', 'Cart not found');
    const item = cart.items.find((i) => i.id === itemId);
    if (!item) throw new NotFoundError('CART_ITEM_NOT_FOUND', 'Cart item not found');

    if (quantity <= 0) {
      await this.prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      const available = await this.availableStock(item.productId, item.variantId);
      if (quantity > available) {
        throw new BadRequestError(
          ErrorCodes.INSUFFICIENT_STOCK,
          `Only ${available} unit(s) available in stock`,
        );
      }
      await this.prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
    }

    return this.getCart(userId, sessionKey);
  }

  async removeItem(userId: string | undefined, sessionKey: string | undefined, itemId: string) {
    const cart = await this.resolveCart(userId, sessionKey);
    if (!cart) throw new NotFoundError('CART_NOT_FOUND', 'Cart not found');
    await this.prisma.cartItem.deleteMany({
      where: { id: itemId, cartId: cart.id },
    });
    return this.getCart(userId, sessionKey);
  }

  async clear(userId: string | undefined, sessionKey: string | undefined) {
    const cart = await this.resolveCart(userId, sessionKey);
    if (cart) {
      await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      await this.prisma.cart.update({
        where: { id: cart.id },
        data: { couponCode: null, abandonedAt: null },
      });
    }
    return this.getCart(userId, sessionKey);
  }

  async merge(userId: string, sessionKey?: string) {
    if (!sessionKey) return;
    const guestCart = await this.prisma.cart.findUnique({ where: { sessionKey } });
    if (!guestCart) return;

    const userCart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!userCart) {
      // adopt guest cart as user's cart
      await this.prisma.cart.update({
        where: { id: guestCart.id },
        data: { userId, sessionKey: null },
      });
      await this.resolveCart(userId, undefined);
      return;
    }

    // Merge guest items into user cart
    const guestItems = await this.prisma.cartItem.findMany({ where: { cartId: guestCart.id } });
    for (const g of guestItems) {
      const existing = await this.prisma.cartItem.findUnique({
        where: {
          cartId_productId_variantId: {
            cartId: userCart.id,
            productId: g.productId,
            variantId: g.variantId!,
          },
        },
      });
      if (existing) {
        const available = await this.availableStock(g.productId, g.variantId);
        const newQty = Math.min(existing.quantity + g.quantity, available);
        await this.prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: newQty },
        });
      } else {
        await this.prisma.cartItem.create({
          data: {
            cartId: userCart.id,
            productId: g.productId,
            variantId: g.variantId,
            quantity: g.quantity,
            unitPrice: g.unitPrice,
          },
        });
      }
    }
    // Preserve coupon if user cart has none
    if (!userCart.couponCode && guestCart.couponCode) {
      await this.prisma.cart.update({
        where: { id: userCart.id },
        data: { couponCode: guestCart.couponCode },
      });
    }
    await this.prisma.cartItem.deleteMany({ where: { cartId: guestCart.id } });
    await this.prisma.cart.delete({ where: { id: guestCart.id } });
  }

  async applyCoupon(userId: string | undefined, sessionKey: string | undefined, code: string) {
    const cart = await this.ensureCart(userId, sessionKey);
    const coupon = await this.prisma.coupon.findUnique({ where: { code } });
    if (!coupon || !coupon.isActive) {
      throw new BadRequestError(ErrorCodes.COUPON_INVALID, 'This coupon code is invalid');
    }
    const now = new Date();
    if (coupon.startsAt && now < coupon.startsAt) {
      throw new BadRequestError(ErrorCodes.COUPON_INVALID, 'This coupon is not active yet');
    }
    if (coupon.expiresAt && now > coupon.expiresAt) {
      throw new BadRequestError(ErrorCodes.COUPON_EXPIRED, 'This coupon has expired');
    }
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestError(ErrorCodes.COUPON_USED, 'This coupon has reached its usage limit');
    }

    await this.prisma.cart.update({
      where: { id: cart.id },
      data: { couponCode: code },
    });
    return this.getCart(userId, sessionKey);
  }

  async removeCoupon(userId: string | undefined, sessionKey: string | undefined) {
    const cart = await this.resolveCart(userId, sessionKey);
    if (cart) {
      await this.prisma.cart.update({ where: { id: cart.id }, data: { couponCode: null } });
    }
    return this.getCart(userId, sessionKey);
  }

  // -------- helpers --------

  private async resolveCart(userId?: string, sessionKey?: string) {
    if (userId) {
      // merge any guest cart into user's cart
      if (sessionKey) {
        await this.merge(userId, sessionKey);
      }
      const userCart = await this.prisma.cart.findUnique({
        where: { userId },
        include: { items: { include: { product: { include: { images: true, variants: true, categories: true } }, variant: true } } },
      });
      if (userCart) return userCart as unknown as CartWithItems;
      return this.ensureCart(userId, undefined);
    }
    if (sessionKey) {
      const guestCart = await this.prisma.cart.findUnique({
        where: { sessionKey },
        include: { items: { include: { product: { include: { images: true, variants: true, categories: true } }, variant: true } } },
      });
      if (guestCart) return guestCart as unknown as CartWithItems;
    }
    return null;
  }

  private async ensureCart(userId?: string, sessionKey?: string) {
    if (userId) {
      return (
        (await this.prisma.cart.findUnique({
          where: { userId },
          include: { items: true },
        })) ??
        (await this.prisma.cart.create({ data: { userId }, include: { items: true } }))
      );
    }
    if (sessionKey) {
      return (
        (await this.prisma.cart.findUnique({
          where: { sessionKey },
          include: { items: true },
        })) ??
        (await this.prisma.cart.create({ data: { sessionKey }, include: { items: true } }))
      );
    }
    // No user, no session -> create a guest cart with a fresh session key
    const key = (globalThis as never as { __cartSeq?: number }).__cartSeq =
      ((globalThis as never as { __cartSeq?: number }).__cartSeq ?? 0) + 1;
    const sessionKeyGenerated = `anon-${Date.now()}-${key}`;
    return this.prisma.cart.create({
      data: { sessionKey: sessionKeyGenerated },
      include: { items: true },
    });
  }

  private async availableStock(productId: string, variantId: string | null): Promise<number> {
    const v = await this.prisma.productVariant.findUnique({ where: { id: variantId! } });
    if (v) return v.stock;
    const variant = await this.prisma.productVariant.findFirst({ where: { productId } });
    return variant?.stock ?? 0;
  }

  private emptyCart(): CartDto {
    return {
      id: '',
      items: [],
      couponCode: null,
      subtotal: 0,
      discount: 0,
      shipping: 0,
      tax: 0,
      total: 0,
      itemCount: 0,
    };
  }

  private async toCartDto(cart: CartWithItems, shippingMethodId: string | null): Promise<CartDto> {
    const activeItems = cart.items.filter((i) => i.product.status === 'ACTIVE');

    const lines = activeItems.map((item) => ({
      productId: item.productId,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      categoryIds: item.product.categories.map((c) => c.categoryId),
    }));

    const couponCode = cart.couponCode ?? undefined;
    const coupon = couponCode
      ? await this.prisma.coupon.findUnique({ where: { code: couponCode } })
      : null;

    // Default shipping method: cheapest active if none chosen (unless free-shipping coupon)
    const freeShipping = coupon?.type === 'FREE_SHIPPING';
    let shippingMethodIdForPricing = shippingMethodId;
    if (!shippingMethodIdForPricing && !freeShipping) {
      const cheapest = await this.prisma.shippingMethod.findFirst({
        where: { isActive: true },
        orderBy: { price: 'asc' },
      });
      if (cheapest) shippingMethodIdForPricing = cheapest.id;
    }

    const pricing = await this.pricing.calculateTotals({
      lines,
      couponId: coupon?.id ?? null,
      couponInput: coupon ? { couponCode: cart.couponCode! } : null,
      shippingMethodId: freeShipping ? null : shippingMethodIdForPricing,
    });

    const items: CartLineDto[] = activeItems.map((item) => ({
      variantId: item.variantId ?? item.product.variants[0]?.id ?? '',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.unitPrice * item.quantity,
      product: this.toProductDto(item.product),
    }));

    return {
      id: cart.id,
      items,
      couponCode: cart.couponCode,
      subtotal: pricing.subtotal,
      discount: pricing.discount,
      shipping: pricing.shipping,
      tax: pricing.tax,
      total: pricing.total,
      itemCount: pricing.itemCount,
    };
  }

  private toProductDto(p: CartWithItems['items'][number]['product']): ProductDto {
    const variants = p.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      price: v.price,
      salePrice: v.salePrice,
      stock: v.stock,
      attributes: (v.attributes ?? {}) as Record<string, string>,
      imageUrl: v.imageUrl,
      barcode: v.barcode,
    }));
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      description: null,
      shortDescription: null,
      price: p.price,
      salePrice: p.salePrice,
      costPrice: null,
      status: p.status as ProductDto['status'],
      featured: p.featured,
      rating: p.rating,
      reviewCount: p.reviewCount,
      images: p.images.map((img) => ({ id: img.id, url: img.url, alt: img.alt, position: img.position })),
      variants,
      categoryIds: p.categories.map((c) => c.categoryId),
      brandId: null,
      tags: [],
      attributes: {},
      stock: variants.reduce((s, v) => s + v.stock, 0),
      seoTitle: p.seoTitle,
      seoDescription: p.seoDescription,
      createdAt: p.createdAt.toISOString(),
    };
  }
}
