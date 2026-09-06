import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

const PUBLIC_PREFIXES = ['store.', 'seo.', 'social.', 'theme.'];

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublic() {
    const settings = await this.prisma.siteSettings.findMany();
    const result: Record<string, unknown> = {};
    for (const s of settings) {
      if (PUBLIC_PREFIXES.some((p) => s.key.startsWith(p))) {
        result[s.key.replace('store.', '').replace('seo.', '').replace('social.', '').replace('theme.', '')] =
          s.value;
      }
    }
    return result;
  }

  async getAll() {
    const settings = await this.prisma.siteSettings.findMany({ orderBy: { key: 'asc' } });
    const grouped: Record<string, Record<string, unknown>> = {};
    for (const s of settings) {
      (grouped[s.group] ??= {})[s.key] = s.value;
    }
    return grouped;
  }

  async getGroup(group: string) {
    const settings = await this.prisma.siteSettings.findMany({ where: { group } });
    const result: Record<string, unknown> = {};
    for (const s of settings) result[s.key] = s.value;
    return result;
  }

  async update(updates: Record<string, unknown>, group = 'general') {
    for (const [key, value] of Object.entries(updates)) {
      await this.prisma.siteSettings.upsert({
        where: { key },
        update: { value: value as never, group },
        create: { key, value: value as never, group },
      });
    }
    return this.getAll();
  }
}
