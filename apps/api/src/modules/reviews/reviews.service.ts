import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../common/errors/app-error';
import { paginate, buildPaginationMeta } from '../../common/utils/pagination';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    input: { productId: string; rating: number; title?: string; body?: string; images?: string[] },
  ) {
    const product = await this.prisma.product.findUnique({ where: { id: input.productId } });
    if (!product) throw new NotFoundError('PRODUCT_NOT_FOUND', 'Product not found');

    // Prevent duplicate reviews
    const existing = await this.prisma.review.findUnique({
      where: { productId_userId: { productId: input.productId, userId } },
    });
    if (existing) {
      throw new BadRequestError('DUPLICATE_REVIEW', 'You have already reviewed this product');
    }

    // Verify purchase (soft verification)
    let isVerified = 0;
    const order = await this.prisma.order.findFirst({
      where: { userId, items: { some: { productId: input.productId } } },
    });
    if (order) isVerified = 1;

    const review = await this.prisma.review.create({
      data: {
        productId: input.productId,
        userId,
        rating: input.rating,
        title: input.title ?? null,
        body: input.body ?? null,
        images: input.images ?? [],
        status: 'PENDING',
        isVerified,
      },
    });

    // Auto-approve verified purchase reviews for a smoother UX, else leave pending
    await this.recomputeRating(input.productId);
    return review;
  }

  async productReviews(productId: string, query: { page?: number; limit?: number }) {
    const { page, limit, skip, take } = paginate(query);
    const [total, items] = await this.prisma.$transaction([
      this.prisma.review.count({ where: { productId, status: 'APPROVED' } }),
      this.prisma.review.findMany({
        where: { productId, status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          user: { select: { firstName: true, lastName: true, imageUrl: true } },
        },
      }),
    ]);
    return { items, meta: buildPaginationMeta(total, page, limit) };
  }

  async myReviews(userId: string) {
    return this.prisma.review.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { product: { select: { id: true, name: true, slug: true, images: true } } },
    });
  }

  async update(userId: string, reviewId: string, input: { rating?: number; title?: string; body?: string; images?: string[] }) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundError('REVIEW_NOT_FOUND', 'Review not found');
    if (review.userId !== userId) throw new ForbiddenError();

    const data: Record<string, unknown> = {};
    if (input.rating !== undefined) data.rating = input.rating;
    if (input.title !== undefined) data.title = input.title;
    if (input.body !== undefined) data.body = input.body;
    if (input.images !== undefined) data.images = input.images;
    if (data.status === undefined) data.status = 'PENDING';

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: { ...data, status: 'PENDING' } as never,
    });
    await this.recomputeRating(review.productId);
    return updated;
  }

  async remove(userId: string, reviewId: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundError('REVIEW_NOT_FOUND', 'Review not found');
    if (review.userId !== userId) throw new ForbiddenError();
    await this.prisma.review.delete({ where: { id: reviewId } });
    await this.recomputeRating(review.productId);
    return { id: reviewId };
  }

  async moderate(reviewId: string, status: 'APPROVED' | 'REJECTED') {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundError('REVIEW_NOT_FOUND', 'Review not found');
    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: { status },
    });
    await this.recomputeRating(review.productId);
    return updated;
  }

  async adminList(query: { page?: number; limit?: number; status?: string }) {
    const { page, limit, skip, take } = paginate(query);
    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    const [total, items] = await this.prisma.$transaction([
      this.prisma.review.count({ where: where as never }),
      this.prisma.review.findMany({
        where: where as never,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          product: { select: { id: true, name: true, slug: true } },
        },
      }),
    ]);
    return { items, meta: buildPaginationMeta(total, page, limit) };
  }

  async adminRespond(reviewId: string, response: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundError('REVIEW_NOT_FOUND', 'Review not found');
    return this.prisma.review.update({
      where: { id: reviewId },
      data: { adminResponse: response },
    });
  }

  async deleteAdmin(reviewId: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundError('REVIEW_NOT_FOUND', 'Review not found');
    await this.prisma.review.delete({ where: { id: reviewId } });
    await this.recomputeRating(review.productId);
    return { id: reviewId };
  }

  private async recomputeRating(productId: string) {
    const agg = await this.prisma.review.aggregate({
      where: { productId, status: 'APPROVED' },
      _avg: { rating: true },
      _count: true,
    });
    const average = agg._avg.rating ?? 0;
    const count = agg._count;
    await this.prisma.product.update({
      where: { id: productId },
      data: { rating: Math.round(average * 100) / 100, reviewCount: count },
    });
  }
}
