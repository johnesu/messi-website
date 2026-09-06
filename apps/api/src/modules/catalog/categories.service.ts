import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotFoundError } from '../../common/errors/app-error';
import type { CreateCategoryInput } from '@mesi/validation';
import type { CategoryDto } from '@mesi/types';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findTree() {
    const categories = await this.prisma.category.findMany({
      include: {
        _count: { select: { productCategories: true } },
        children: { include: { _count: { select: { productCategories: true } } } },
      },
    });
    const roots = categories.filter((c) => !c.parentId);
    const tree = roots.map((c) => this.toDto(c as never));
    const byParent = new Map<string, CategoryDto[]>();
    for (const child of categories.filter((c) => c.parentId)) {
      const dto = this.toDto(child as never);
      const arr = byParent.get(child.parentId!) ?? [];
      arr.push(dto);
      byParent.set(child.parentId!, arr);
    }
    const attach = (nodes: CategoryDto[]) => {
      for (const node of nodes) {
        const kids = byParent.get(node.id);
        if (kids?.length) {
          node.children = kids;
          attach(kids);
        }
      }
    };
    attach(tree);
    return tree;
  }

  async findAll() {
    const categories = await this.prisma.category.findMany({
      orderBy: { position: 'asc' },
      include: { _count: { select: { productCategories: true } } },
    });
    return categories;
  }

  async findOne(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: { _count: { select: { productCategories: true } } },
    });
    if (!category) throw new NotFoundError('CATEGORY_NOT_FOUND', 'Category not found');
    return this.toDto(category as never);
  }

  async create(input: CreateCategoryInput) {
    const slug = input.slug ?? this.slugify(input.name);
    return this.prisma.category.create({
      data: {
        name: input.name,
        slug,
        description: input.description ?? null,
        imageUrl: input.imageUrl ?? null,
        parentId: input.parentId ?? null,
      },
    });
  }

  async update(id: string, input: Partial<CreateCategoryInput>) {
    await this.ensureExists(id);
    const data: Record<string, unknown> = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.slug !== undefined) data.slug = input.slug;
    if (input.description !== undefined) data.description = input.description;
    if (input.imageUrl !== undefined) data.imageUrl = input.imageUrl;
    if (input.parentId !== undefined) data.parentId = input.parentId;
    return this.prisma.category.update({ where: { id }, data: data as never });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.category.delete({ where: { id } });
    return { id };
  }

  private async ensureExists(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundError('CATEGORY_NOT_FOUND', 'Category not found');
    return category;
  }

  private countOf(c: { _count?: { productCategories: number } }) {
    return (c._count?.productCategories ?? 0) as number;
  }

  private toDto(c: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    imageUrl: string | null;
    parentId: string | null;
    _count?: { productCategories: number };
    children?: unknown[];
  }): CategoryDto {
    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      imageUrl: c.imageUrl,
      parentId: c.parentId,
      productCount: this.countOf(c as never),
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
