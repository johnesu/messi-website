import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotFoundError } from '../../common/errors/app-error';
import { paginate, buildPaginationMeta } from '../../common/utils/pagination';

interface SectionInput {
  type: string;
  title?: string;
  settings?: Record<string, unknown>;
  position?: number;
  enabled?: boolean;
}

@Injectable()
export class PagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getHome() {
    let page = await this.prisma.page.findFirst({
      where: { isHomepage: true, status: 'PUBLISHED' },
      include: { sections: { where: { enabled: true }, orderBy: { position: 'asc' } } },
    });
    if (!page) {
      page = await this.prisma.page.findFirst({
        where: { slug: 'home', status: 'PUBLISHED' },
        include: { sections: { where: { enabled: true }, orderBy: { position: 'asc' } } },
      });
    }
    return page ?? this.defaultHomepage();
  }

  async getPublicBySlug(slug: string) {
    const page = await this.prisma.page.findFirst({
      where: { slug, status: 'PUBLISHED' },
      include: { sections: { where: { enabled: true }, orderBy: { position: 'asc' } } },
    });
    if (!page) throw new NotFoundError('PAGE_NOT_FOUND', 'Page not found');
    return this.serialize(page);
  }

  async findAll(query: { page?: number; limit?: number; status?: string; q?: string }) {
    const { page, limit, skip, take } = paginate(query);
    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.q) where.title = { contains: query.q, mode: 'insensitive' };
    const [total, items] = await this.prisma.$transaction([
      this.prisma.page.count({ where: where as never }),
      this.prisma.page.findMany({
        where: where as never,
        orderBy: { updatedAt: 'desc' },
        skip,
        take,
        include: { sections: { orderBy: { position: 'asc' } } },
      }),
    ]);
    return { items: items.map((p) => this.serialize(p)), meta: buildPaginationMeta(total, page, limit) };
  }

  async findOne(id: string) {
    const page = await this.prisma.page.findUnique({
      where: { id },
      include: { sections: { orderBy: { position: 'asc' } }, versions: { orderBy: { version: 'desc' }, take: 20 } },
    });
    if (!page) throw new NotFoundError('PAGE_NOT_FOUND', 'Page not found');
    return this.serialize(page);
  }

  async create(input: {
    title: string;
    slug?: string;
    isHomepage?: boolean;
    seoTitle?: string;
    seoDescription?: string;
    sections?: SectionInput[];
    actorId?: string;
  }) {
    const slug = input.slug ?? this.slugify(input.title);
    const page = await this.prisma.page.create({
      data: {
        title: input.title,
        slug,
        isHomepage: input.isHomepage ?? false,
        seoTitle: input.seoTitle ?? null,
        seoDescription: input.seoDescription ?? null,
        status: 'DRAFT',
        version: 1,
        sections: input.sections?.length
          ? {
              create: input.sections.map((s, idx) => ({
                type: s.type as never,
                title: s.title ?? null,
                settings: (s.settings ?? {}) as never,
                position: s.position ?? idx,
                enabled: s.enabled ?? true,
              })),
            }
          : undefined,
      },
      include: { sections: { orderBy: { position: 'asc' } } },
    });
    await this.audit.log({
      actorId: input.actorId ?? null,
      action: 'page.create',
      resource: 'page',
      resourceId: page.id,
    });
    return this.serialize(page);
  }

  async update(
    id: string,
    input: Partial<{
      title: string;
      slug: string;
      seoTitle: string;
      seoDescription: string;
      isHomepage: boolean;
      sections: SectionInput[];
      actorId: string;
    }>,
  ) {
    const existing = await this.prisma.page.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('PAGE_NOT_FOUND', 'Page not found');

    const data: Record<string, unknown> = {};
    if (input.title !== undefined) data.title = input.title;
    if (input.slug !== undefined) data.slug = input.slug;
    if (input.seoTitle !== undefined) data.seoTitle = input.seoTitle;
    if (input.seoDescription !== undefined) data.seoDescription = input.seoDescription;
    if (input.isHomepage !== undefined) data.isHomepage = input.isHomepage;

    const page = await this.prisma.$transaction(async (tx) => {
      if (input.sections !== undefined) {
        await tx.pageSection.deleteMany({ where: { pageId: id } });
        data.sections = {
          create: input.sections.map((s, idx) => ({
            type: s.type as never,
            title: s.title ?? null,
            settings: (s.settings ?? {}) as never,
            position: s.position ?? idx,
            enabled: s.enabled ?? true,
          })),
        };
      }
      return tx.page.update({
        where: { id },
        data: data as never,
        include: { sections: { orderBy: { position: 'asc' } } },
      });
    });

    await this.audit.log({
      actorId: input.actorId ?? null,
      action: 'page.update',
      resource: 'page',
      resourceId: id,
    });
    return this.serialize(page);
  }

  async publish(id: string, actorId?: string) {
    const page = await this.prisma.page.findUnique({ where: { id } });
    if (!page) throw new NotFoundError('PAGE_NOT_FOUND', 'Page not found');
    const updated = await this.prisma.page.update({
      where: { id },
      data: { status: 'PUBLISHED', publishedAt: new Date(), scheduledAt: null },
    });
    await this.audit.log({
      actorId: actorId ?? null,
      action: 'page.publish',
      resource: 'page',
      resourceId: id,
    });
    return updated;
  }

  async unpublish(id: string, actorId?: string) {
    const page = await this.prisma.page.findUnique({ where: { id } });
    if (!page) throw new NotFoundError('PAGE_NOT_FOUND', 'Page not found');
    const updated = await this.prisma.page.update({
      where: { id },
      data: { status: 'DRAFT' },
    });
    await this.audit.log({
      actorId: actorId ?? null,
      action: 'page.unpublish',
      resource: 'page',
      resourceId: id,
    });
    return updated;
  }

  async remove(id: string, actorId?: string) {
    const page = await this.prisma.page.findUnique({ where: { id } });
    if (!page) throw new NotFoundError('PAGE_NOT_FOUND', 'Page not found');
    await this.prisma.page.delete({ where: { id } });
    await this.audit.log({
      actorId: actorId ?? null,
      action: 'page.delete',
      resource: 'page',
      resourceId: id,
    });
    return { id };
  }

  async addSection(
    pageId: string,
    input: { type: string; title?: string; settings?: Record<string, unknown>; position?: number },
  ) {
    const page = await this.prisma.page.findUnique({ where: { id: pageId } });
    if (!page) throw new NotFoundError('PAGE_NOT_FOUND', 'Page not found');
    const maxPos = await this.prisma.pageSection.aggregate({
      where: { pageId },
      _max: { position: true },
    });
    const position = input.position ?? (maxPos._max.position ?? -1) + 1;
    return this.prisma.pageSection.create({
      data: {
        pageId,
        type: input.type as never,
        title: input.title ?? null,
        settings: (input.settings ?? {}) as never,
        position,
      },
    });
  }

  async updateSection(sectionId: string, input: Partial<{ title: string; settings: Record<string, unknown>; position: number; enabled: boolean }>) {
    const section = await this.prisma.pageSection.findUnique({ where: { id: sectionId } });
    if (!section) throw new NotFoundError('SECTION_NOT_FOUND', 'Section not found');
    const data: Record<string, unknown> = {};
    if (input.title !== undefined) data.title = input.title;
    if (input.settings !== undefined) data.settings = input.settings;
    if (input.position !== undefined) data.position = input.position;
    if (input.enabled !== undefined) data.enabled = input.enabled;
    return this.prisma.pageSection.update({ where: { id: sectionId }, data: data as never });
  }

  async removeSection(sectionId: string) {
    await this.prisma.pageSection.delete({ where: { id: sectionId } });
    return { id: sectionId };
  }

  async reorderSections(pageId: string, orderedIds: string[]) {
    await this.prisma.$transaction(
      orderedIds.map((id, index) =>
        this.prisma.pageSection.update({ where: { id }, data: { position: index } }),
      ),
    );
    return this.findOne(pageId);
  }

  private defaultHomepage() {
    const sections = [
      { type: 'HERO', title: 'Welcome to MESI', settings: { heading: 'Premium Shopping, Delivered', subtitle: 'Discover curated products at unbeatable prices' }, position: 0, enabled: true },
      { type: 'PRODUCT_GRID', title: 'Featured Products', settings: { query: 'featured' }, position: 1, enabled: true },
      { type: 'CATEGORY_GRID', title: 'Shop by Category', settings: {}, position: 2, enabled: true },
      { type: 'BANNER', title: 'Limited Time Offer', settings: { text: 'Free shipping on orders over ₦20,000' }, position: 3, enabled: true },
      { type: 'NEWSLETTER', title: 'Stay in the loop', settings: {}, position: 4, enabled: true },
    ];
    return { title: 'Home', slug: 'home', isHomepage: true, sections };
  }

  private serialize(page: {
    id: string;
    title: string;
    slug: string;
    status: string;
    isHomepage: boolean;
    seoTitle: string | null;
    seoDescription: string | null;
    publishedAt: Date | null;
    updatedAt: Date;
    sections: { id: string; type: string; title: string | null; settings: unknown; position: number; enabled: boolean }[];
  }) {
    return {
      id: page.id,
      title: page.title,
      slug: page.slug,
      status: page.status,
      isHomepage: page.isHomepage,
      seoTitle: page.seoTitle,
      seoDescription: page.seoDescription,
      publishedAt: page.publishedAt,
      updatedAt: page.updatedAt,
      sections: page.sections.map((s) => ({
        id: s.id,
        type: s.type,
        title: s.title,
        position: s.position,
        enabled: s.enabled,
        settings: (s.settings ?? {}) as Record<string, unknown>,
      })),
    };
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
