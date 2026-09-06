import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotFoundError } from '../../common/errors/app-error';

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.brand.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
  }

  async findOne(slug: string) {
    const brand = await this.prisma.brand.findUnique({ where: { slug } });
    if (!brand) throw new NotFoundError('BRAND_NOT_FOUND', 'Brand not found');
    return brand;
  }

  async create(input: { name: string; slug?: string; description?: string; logoUrl?: string }) {
    const slug = input.slug ?? this.slugify(input.name);
    return this.prisma.brand.create({
      data: {
        name: input.name,
        slug,
        description: input.description ?? null,
        logoUrl: input.logoUrl ?? null,
      },
    });
  }

  async update(id: string, input: Partial<{ name: string; description: string; logoUrl: string }>) {
    await this.ensureExists(id);
    return this.prisma.brand.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.brand.delete({ where: { id } });
    return { id };
  }

  private async ensureExists(id: string) {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) throw new NotFoundError('BRAND_NOT_FOUND', 'Brand not found');
    return brand;
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
