import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { MediaService } from './media.service';
import { Permissions } from '../../common/decorators/auth.decorator';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  @Permissions('media.view')
  list(@Query('page') page?: string, @Query('limit') limit?: string, @Query('folder') folder?: string, @Query('q') q?: string) {
    return this.mediaService.list({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      folder,
      q,
    });
  }

  @Get('folders')
  @Permissions('media.view')
  folders() {
    return this.mediaService.folders();
  }

  @Post()
  @Permissions('media.upload')
  record(@Body() body: Parameters<MediaService['record']>[0]) {
    return this.mediaService.record(body);
  }

  @Patch(':id')
  @Permissions('media.update')
  update(@Param('id') id: string, @Body() body: Partial<{ altText: string; folder: string; fileName: string }>) {
    return this.mediaService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(200)
  @Permissions('media.delete')
  remove(@Param('id') id: string) {
    return this.mediaService.remove(id);
  }
}
