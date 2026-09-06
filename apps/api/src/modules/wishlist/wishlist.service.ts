import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CartService } from '../cart/cart.service';
import { NotFoundError, BadRequestError } from '../../common/errors/app-error';

@Injectable()
export class WishlistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
  ) {}

  private async ensureWishlist(userId: string) {
    return (
      (await this.prisma.wishlist.findUnique({ where: { userId } })) ??
      (await this.prisma.wishlist.create({ data: { userId } }))
    );
  }

  async get(userId: string) {
    const wishlist = await this.prisma.wishlist.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: { include: { images: true, variants: true } },
            variant: true,
          },
        },
      },
    });
    if (!wishlist) return { id: '', items: [] };
    return {
      id: wishlist.id,
      items: wishlist.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        product: {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          price: item.product.price,
          salePrice: item.product.salePrice,
          image: item.product.images[0]?.url ?? item.variant?.imageUrl ?? null,
        },
      })),
    };
  }

  async add(
    userId: string,
    input: { productId?: string | null; variantId?: string | null },
  ) {
    const wishlist = await this.ensureWishlist(userId);
    if (!input.productId) {
      throw new BadRequestError('PRODUCT_REQUIRED', 'Product is required');
    }
    await this.prisma.wishlistItem.upsert({
      where: { wishlistId_productId: { wishlistId: wishlist.id, productId: input.productId } },
      update: { variantId: input.variantId ?? null },
      create: {
        wishlistId: wishlist.id,
        productId: input.productId,
        variantId: input.variantId ?? null,
      },
    });
    return this.get(userId);
  }

  async remove(userId: string, itemId: string) {
    const wishlist = await this.ensureWishlist(userId);
    await this.prisma.wishlistItem.deleteMany({
      where: { id: itemId, wishlistId: wishlist.id },
    });
    return this.get(userId);
  }

  async moveToCart(userId: string, itemId: string, quantity = 1) {
    const item = await this.prisma.wishlistItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundError('WISHLIST_ITEM_NOT_FOUND', 'Wishlist item not found');
    const cart = await this.cartService.addItem(userId, undefined, {
      productId: item.productId,
      variantId: item.variantId,
      quantity,
    });
    await this.prisma.wishlistItem.delete({ where: { id: itemId } });
    return cart;
  }
}
