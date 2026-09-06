import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotFoundError } from '../../common/errors/app-error';
import { paginate, buildPaginationMeta } from '../../common/utils/pagination';

@Injectable()
export class BlogService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublic(query: { page?: number; limit?: number; category?: string; q?: string }) {
    const { page, limit, skip, take } = paginate(query);
    const where: Record<string, unknown> = { status: 'PUBLISHED' };
    const and: Record<string, unknown>[] = [];
    if (query.category) {
      and.push({ category: { slug: query.category } });
    }
    if (query.q) {
      and.push({
        OR: [
          { title: { contains: query.q, mode: 'insensitive' } },
          { excerpt: { contains: query.q, mode: 'insensitive' } },
        ],
      });
    }
    if (and.length) where.AND = and;

    const [total, items] = await this.prisma.$transaction([
      this.prisma.blogPost.count({ where: where as never }),
      this.prisma.blogPost.findMany({
        where: where as never,
        orderBy: { publishedAt: 'desc' },
        skip,
        take,
        include: { category: true },
      }),
    ]);
    return { items, meta: buildPaginationMeta(total, page, limit) };
  }

  async getPublicBySlug(slug: string) {
    const post = await this.prisma.blogPost.findFirst({
      where: { slug, status: 'PUBLISHED' },
      include: { category: true },
    });
    if (!post) throw new NotFoundError('POST_NOT_FOUND', 'Blog post not found');
    return post;
  }

  async adminList(query: { page?: number; limit?: number; status?: string; q?: string }) {
    const { page, limit, skip, take } = paginate(query);
    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.q) where.title = { contains: query.q, mode: 'insensitive' };
    const [total, items] = await this.prisma.$transaction([
      this.prisma.blogPost.count({ where: where as never }),
      this.prisma.blogPost.findMany({
        where: where as never,
        orderBy: { updatedAt: 'desc' },
        skip,
        take,
        include: { category: true },
      }),
    ]);
    return { items, meta: buildPaginationMeta(total, page, limit) };
  }

  async findOne(id: string) {
    const post = await this.prisma.blogPost.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!post) throw new NotFoundError('POST_NOT_FOUND', 'Blog post not found');
    return post;
  }

  async create(input: {
    title: string;
    slug?: string;
    excerpt?: string;
    content: string;
    coverImage?: string;
    categoryId?: string;
    tags?: string[];
    seoTitle?: string;
    seoDescription?: string;
    authorId?: string;
  }) {
    const slug = input.slug ?? this.slugify(input.title);
    return this.prisma.blogPost.create({
      data: {
        title: input.title,
        slug,
        excerpt: input.excerpt ?? null,
        content: input.content,
        coverImage: input.coverImage ?? null,
        categoryId: input.categoryId ?? null,
        tags: input.tags ?? [],
        seoTitle: input.seoTitle ?? null,
        seoDescription: input.seoDescription ?? null,
        authorId: input.authorId ?? null,
        status: 'DRAFT',
      },
    });
  }

  async update(
    id: string,
    input: Partial<{
      title: string;
      slug: string;
      excerpt: string;
      content: string;
      coverImage: string;
      categoryId: string;
      tags: string[];
      seoTitle: string;
      seoDescription: string;
      status: string;
      scheduledAt: string;
    }>,
  ) {
    await this.findOne(id);
    const data: Record<string, unknown> = {};
    if (input.title !== undefined) data.title = input.title;
    if (input.slug !== undefined) data.slug = input.slug;
    if (input.excerpt !== undefined) data.excerpt = input.excerpt;
    if (input.content !== undefined) data.content = input.content;
    if (input.coverImage !== undefined) data.coverImage = input.coverImage;
    if (input.categoryId !== undefined) data.categoryId = input.categoryId;
    if (input.tags !== undefined) data.tags = input.tags;
    if (input.seoTitle !== undefined) data.seoTitle = input.seoTitle;
    if (input.seoDescription !== undefined) data.seoDescription = input.seoDescription;
    if (input.status !== undefined) data.status = input.status;
    if (input.scheduledAt !== undefined) {
      data.scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;
      if (input.scheduledAt) data.status = 'SCHEDULED';
    }
    if (data.status === 'PUBLISHED') data.publishedAt = new Date();
    return this.prisma.blogPost.update({ where: { id }, data: data as never });
  }

  async publish(id: string) {
    await this.findOne(id);
    return this.prisma.blogPost.update({
      where: { id },
      data: { status: 'PUBLISHED', publishedAt: new Date(), scheduledAt: null },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.blogPost.delete({ where: { id } });
    return { id };
  }

  async categories() {
    return this.prisma.blogCategory.findMany({
      include: { _count: { select: { posts: true } } },
    });
  }

  async createCategory(input: { name: string; slug?: string }) {
    const slug = input.slug ?? this.slugify(input.name);
    return this.prisma.blogCategory.create({ data: { name: input.name, slug } });
  }

  private slugify(input: string): string {
    return input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
