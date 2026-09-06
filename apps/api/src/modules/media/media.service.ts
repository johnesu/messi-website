import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotFoundError } from '../../common/errors/app-error';
import { paginate, buildPaginationMeta } from '../../common/utils/pagination';

@Injectable()
export class MediaService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: { page?: number; limit?: number; folder?: string; q?: string }) {
    const { page, limit, skip, take } = paginate(query);
    const where: Record<string, unknown> = {};
    if (query.folder) where.folder = query.folder;
    if (query.q) {
      where.OR = [
        { originalName: { contains: query.q, mode: 'insensitive' } },
        { altText: { contains: query.q, mode: 'insensitive' } },
      ];
    }
    const [total, items] = await this.prisma.$transaction([
      this.prisma.mediaAsset.count({ where: where as never }),
      this.prisma.mediaAsset.findMany({
        where: where as never,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);
    return { items, meta: buildPaginationMeta(total, page, limit) };
  }

  async folders() {
    const folders = await this.prisma.mediaAsset.groupBy({
      by: ['folder'],
      _count: true,
    });
    return folders.map((f) => ({ folder: f.folder, count: f._count }));
  }

  async record(input: {
    fileName: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    altText?: string;
    width?: number;
    height?: number;
    folder?: string;
    createdById?: string;
  }) {
    return this.prisma.mediaAsset.create({
      data: {
        fileName: input.fileName,
        originalName: input.originalName,
        mimeType: input.mimeType,
        size: input.size,
        url: input.url,
        altText: input.altText ?? null,
        width: input.width ?? null,
        height: input.height ?? null,
        folder: input.folder ?? 'default',
        createdById: input.createdById ?? null,
      },
    });
  }

  async update(id: string, input: Partial<{ altText: string; folder: string; fileName: string }>) {
    await this.ensureExists(id);
    const data: Record<string, unknown> = {};
    if (input.altText !== undefined) data.altText = input.altText;
    if (input.folder !== undefined) data.folder = input.folder;
    if (input.fileName !== undefined) data.fileName = input.fileName;
    return this.prisma.mediaAsset.update({ where: { id }, data: data as never });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.mediaAsset.delete({ where: { id } });
    return { id };
  }

  private async ensureExists(id: string) {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) throw new NotFoundError('MEDIA_NOT_FOUND', 'Media not found');
    return asset;
  }
}
