import { Controller, Get, HttpCode, Param, Patch, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(@CurrentUser('id') userId: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.notificationsService.listMy(userId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('unread-count')
  unreadCount(@CurrentUser('id') userId: string) {
    return this.notificationsService.unreadCount(userId);
  }

  @Patch('read-all')
  @HttpCode(200)
  markAllRead(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAllRead(userId);
  }

  @Patch(':id/read')
  @HttpCode(200)
  markRead(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.notificationsService.markRead(userId, id);
  }
}
