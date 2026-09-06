import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotFoundError, BadRequestError } from '../../common/errors/app-error';
import { paginate, buildPaginationMeta } from '../../common/utils/pagination';
import type {
  CreateProductInput,
  UpdateProductInput,
  ProductSearchInput,
} from '@mesi/validation';
import type { ProductDto } from '@mesi/types';

type ProductWithRelations = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string | null;
  shortDescription: string | null;
  price: number;
  salePrice: number | null;
  costPrice: number | null;
  status: string;
  featured: boolean;
  rating: number;
  reviewCount: number;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: Date;
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
  categories: { categoryId: string }[];
  brandId: string | null;
  productTags: { tag: { name: string } }[];
};

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async search(query: ProductSearchInput) {
    const { page, limit, skip, take } = paginate(query);

    const where: Record<string, unknown> = { status: { in: ['ACTIVE', 'OUT_OF_STOCK'] } };
    const and: Record<string, unknown>[] = [];

    if (query.q) {
      and.push({
        OR: [
          { name: { contains: query.q, mode: 'insensitive' } },
          { sku: { contains: query.q, mode: 'insensitive' } },
          { shortDescription: { contains: query.q, mode: 'insensitive' } },
          { productTags: { some: { tag: { name: { contains: query.q, mode: 'insensitive' } } } } },
        ],
      });
    }
    if (query.category) {
      and.push({ categories: { some: { category: { slug: query.category } } } });
    }
    if (query.brand) {
      and.push({ brand: { slug: query.brand } });
    }
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      const range: Record<string, number> = {};
      if (query.minPrice !== undefined) range.gte = query.minPrice;
      if (query.maxPrice !== undefined) range.lte = query.maxPrice;
      and.push({ price: range });
    }
    if (query.inStock !== undefined) {
      and.push({
        variants: query.inStock
          ? { some: { stock: { gt: 0 } } }
          : { every: { stock: 0 } },
      });
    }
    if (query.rating !== undefined) {
      and.push({ rating: { gte: query.rating } });
    }

    if (and.length) where.AND = and;

    const orderBy = this.orderBy(query.sort);

    const [total, products] = await this.prisma.$transaction([
      this.prisma.product.count({ where: where as never }),
      this.prisma.product.findMany({
        where: where as never,
        orderBy,
        skip,
        take,
        include: {
          images: { orderBy: { position: 'asc' } },
          variants: true,
          categories: true,
          brand: true,
          productTags: { include: { tag: true } },
        },
      }),
    ]);

    return {
      items: products.map((p) => this.toDto(p as never as ProductWithRelations)),
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    q?: string;
    searchAll?: boolean;
  }) {
    const { page, limit, skip, take } = paginate(query);
    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { sku: { contains: query.q, mode: 'insensitive' } },
      ];
    }
    if (query.category) {
      where.categories = { some: { category: { slug: query.category } } };
    }

    const [total, products] = await this.prisma.$transaction([
      this.prisma.product.count({ where: where as never }),
      this.prisma.product.findMany({
        where: where as never,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          images: { orderBy: { position: 'asc' } },
          variants: true,
          categories: true,
          productTags: { include: { tag: true } },
        },
      }),
    ]);

    return {
      items: products.map((p) => this.toDto(p as never as ProductWithRelations)),
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async findOne(idOrSlug: string, actorId?: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        ...(actorId ? {} : { status: { in: ['ACTIVE', 'OUT_OF_STOCK'] } }),
      },
      include: {
        images: { orderBy: { position: 'asc' } },
        variants: true,
        categories: { include: { category: true } },
        brand: true,
        productTags: { include: { tag: true } },
        reviews: {
          where: { status: 'APPROVED' },
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    });
    if (!product) throw new NotFoundError('PRODUCT_NOT_FOUND', 'Product not found');
    return this.toDto(product as never as ProductWithRelations);
  }

  async create(input: CreateProductInput, actorId: string, req?: unknown) {
    const slug = input.slug ?? this.slugify(input.name);
    const existing = await this.prisma.product.findUnique({ where: { slug } });
    if (existing) {
      throw new BadRequestError('SLUG_EXISTS', 'A product with this slug already exists');
    }

    const product = await this.prisma.product.create({
      data: {
        name: input.name,
        slug,
        sku: input.sku,
        description: input.description ?? null,
        shortDescription: input.shortDescription ?? null,
        price: input.price,
        salePrice: input.salePrice ?? null,
        costPrice: input.costPrice ?? null,
        weight: input.weight ?? null,
        length: input.dimensions?.length ?? null,
        width: input.dimensions?.width ?? null,
        height: input.dimensions?.height ?? null,
        status: input.status,
        featured: input.featured,
        seoTitle: input.seoTitle ?? null,
        seoDescription: input.seoDescription ?? null,
        brandId: input.brandId ?? null,
        images: {
          create: input.images.map((img) => ({
            url: img.url,
            alt: img.alt,
            position: img.position,
          })),
        },
        variants: {
          create: input.variants.length
            ? input.variants.map((v, idx) => ({
                sku: v.sku,
                price: v.price,
                salePrice: v.salePrice ?? null,
                costPrice: v.costPrice ?? null,
                stock: v.stock,
                attributes: v.attributes as never,
                imageUrl: v.imageUrl ?? null,
                barcode: v.barcode ?? null,
                isDefault: idx === 0,
              }))
            : [
                {
                  sku: input.sku,
                  price: input.price,
                  salePrice: input.salePrice ?? null,
                  stock: 0,
                  attributes: {},
                  isDefault: true,
                },
              ],
        },
        categories: {
          create: input.categoryIds.map((categoryId) => ({ categoryId })),
        },
        productTags: {
          create: input.tags.map((name) => ({ tag: { connectOrCreate: { where: { name }, create: { name, slug: this.slugify(name) } } } })),
        },
      },
      include: {
        images: true,
        variants: true,
        categories: true,
        productTags: { include: { tag: true } },
      },
    });

    await this.audit.log(
      { actorId, action: 'product.create', resource: 'product', resourceId: product.id, metadata: { slug, name: product.name } },
      req as never,
    );

    return product;
  }

  async update(id: string, input: UpdateProductInput, actorId: string, req?: unknown) {
    await this.findOneById(id);

    const data: Record<string, unknown> = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.sku !== undefined) data.sku = input.sku;
    if (input.slug !== undefined) data.slug = input.slug;
    if (input.description !== undefined) data.description = input.description;
    if (input.shortDescription !== undefined) data.shortDescription = input.shortDescription;
    if (input.price !== undefined) data.price = input.price;
    if (input.salePrice !== undefined) data.salePrice = input.salePrice;
    if (input.costPrice !== undefined) data.costPrice = input.costPrice;
    if (input.weight !== undefined) data.weight = input.weight;
    if (input.dimensions !== undefined) {
      data.length = input.dimensions?.length ?? null;
      data.width = input.dimensions?.width ?? null;
      data.height = input.dimensions?.height ?? null;
    }
    if (input.status !== undefined) data.status = input.status;
    if (input.featured !== undefined) data.featured = input.featured;
    if (input.seoTitle !== undefined) data.seoTitle = input.seoTitle;
    if (input.seoDescription !== undefined) data.seoDescription = input.seoDescription;
    if (input.brandId !== undefined) data.brandId = input.brandId;
    if (input.categoryIds !== undefined) {
      await this.prisma.productCategory.deleteMany({ where: { productId: id } });
      data.categories = { create: input.categoryIds.map((categoryId) => ({ categoryId })) };
    }

    const product = await this.prisma.$transaction(async (tx) => {
      if (input.images !== undefined) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        data.images = {
          create: input.images.map((img) => ({ url: img.url, alt: img.alt, position: img.position })),
        };
      }
      if (input.variants !== undefined) {
        await tx.productVariant.deleteMany({ where: { productId: id } });
        data.variants = {
          create: input.variants.map((v, idx) => ({
            sku: v.sku,
            price: v.price,
            salePrice: v.salePrice ?? null,
            stock: v.stock,
            attributes: v.attributes as never,
            imageUrl: v.imageUrl ?? null,
            barcode: v.barcode ?? null,
            isDefault: idx === 0,
          })),
        };
      }
      return tx.product.update({ where: { id }, data: data as never });
    });

    await this.audit.log(
      { actorId, action: 'product.update', resource: 'product', resourceId: id, metadata: { fields: Object.keys(data) } },
      req as never,
    );

    return product;
  }

  async remove(id: string, actorId: string, req?: unknown) {
    await this.findOneById(id);
    await this.prisma.product.update({ where: { id }, data: { status: 'ARCHIVED' } });
    await this.audit.log(
      { actorId, action: 'product.archive', resource: 'product', resourceId: id },
      req as never,
    );
    return { id };
  }

  async findRelated(productId: string, categoryId?: string, limit = 4) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { categories: true },
    });
    if (!product) return [];
    const catId =
      categoryId ?? product.categories[0]?.categoryId;
    const related = await this.prisma.product.findMany({
      where: {
        id: { not: productId },
        status: 'ACTIVE',
        ...(catId ? { categories: { some: { categoryId: catId } } } : {}),
      },
      take: limit,
      include: {
        images: true,
        variants: true,
        categories: true,
        productTags: { include: { tag: true } },
      },
    });
    return related.map((p) => this.toDto(p as never as ProductWithRelations));
  }

  private async findOneById(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundError('PRODUCT_NOT_FOUND', 'Product not found');
    return product;
  }

  private orderBy(
    sort?: string,
  ): Record<string, 'asc' | 'desc'>[] {
    switch (sort) {
      case 'price_asc':
        return [{ price: 'asc' } as never];
      case 'price_desc':
        return [{ price: 'desc' } as never];
      case 'newest':
        return [{ createdAt: 'desc' } as never];
      case 'popular':
        return [{ reviewCount: 'desc' } as never];
      case 'rating':
        return [{ rating: 'desc' } as never];
      default:
        return [{ createdAt: 'desc' } as never];
    }
  }

  slugify(input: string): string {
    return input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  toDto(p: ProductWithRelations): ProductDto {
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
    const effectivePrice = Math.min(...variants.map((v) => v.price));
    const effectiveSale = variants
      .map((v) => (v.salePrice ?? null))
      .filter((x): x is number => x !== null)
      .reduce((min, x) => Math.min(min, x), Number.POSITIVE_INFINITY);
    const salePrice = variants.some((v) => v.salePrice !== null)
      ? Number.isFinite(effectiveSale)
        ? effectiveSale
        : null
      : null;

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      description: p.shortDescription,
      shortDescription: p.shortDescription,
      price: effectivePrice,
      salePrice,
      costPrice: p.costPrice,
      status: p.status as ProductDto['status'],
      featured: p.featured,
      rating: p.rating,
      reviewCount: p.reviewCount,
      images: p.images.map((img) => ({ id: img.id, url: img.url, alt: img.alt, position: img.position })),
      variants,
      categoryIds: p.categories.map((c) => c.categoryId),
      brandId: p.brandId,
      tags: p.productTags.map((pt) => pt.tag.name),
      attributes: {},
      stock: variants.reduce((sum, v) => sum + v.stock, 0),
      seoTitle: p.seoTitle,
      seoDescription: p.seoDescription,
      createdAt: p.createdAt.toISOString(),
    };
  }
}
