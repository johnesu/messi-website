import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotFoundError } from '../../common/errors/app-error';
import { paginate, buildPaginationMeta } from '../../common/utils/pagination';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listMy(userId: string, query: { page?: number; limit?: number }) {
    const { page, limit, skip, take } = paginate(query);
    const [total, items] = await this.prisma.$transaction([
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);
    return { items, meta: buildPaginationMeta(total, page, limit) };
  }

  async unreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, readAt: null },
    });
  }

  async markRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notification) throw new NotFoundError('NOTIFICATION_NOT_FOUND', 'Notification not found');
    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date(), status: 'READ' },
    });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date(), status: 'READ' },
    });
    return { updated: true };
  }
}
