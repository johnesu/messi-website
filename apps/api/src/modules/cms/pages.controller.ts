import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { PagesService } from './pages.service';
import { Public, Permissions } from '../../common/decorators/auth.decorator';

@Controller('pages')
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Public()
  @Get('home')
  home() {
    return this.pagesService.getHome();
  }

  @Public()
  @Get('public/:slug')
  publicPage(@Param('slug') slug: string) {
    return this.pagesService.getPublicBySlug(slug);
  }

  @Get()
  @Permissions('pages.view')
  list(@Query('page') page?: string, @Query('limit') limit?: string, @Query('status') status?: string, @Query('q') q?: string) {
    return this.pagesService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
      q,
    });
  }

  @Get(':id')
  @Permissions('pages.view')
  findOne(@Param('id') id: string) {
    return this.pagesService.findOne(id);
  }

  @Post()
  @Permissions('pages.create')
  create(@Body() body: Parameters<PagesService['create']>[0]) {
    return this.pagesService.create(body);
  }

  @Patch(':id')
  @Permissions('pages.update')
  update(@Param('id') id: string, @Body() body: Parameters<PagesService['update']>[1]) {
    return this.pagesService.update(id, body);
  }

  @Post(':id/publish')
  @Permissions('cms.publish')
  publish(@Param('id') id: string) {
    return this.pagesService.publish(id);
  }

  @Post(':id/unpublish')
  @Permissions('cms.publish')
  unpublish(@Param('id') id: string) {
    return this.pagesService.unpublish(id);
  }

  @Delete(':id')
  @HttpCode(200)
  @Permissions('pages.delete')
  remove(@Param('id') id: string) {
    return this.pagesService.remove(id);
  }

  @Post(':id/sections')
  @Permissions('pages.update')
  addSection(@Param('id') id: string, @Body() body: { type: string; title?: string; settings?: Record<string, unknown>; position?: number }) {
    return this.pagesService.addSection(id, body);
  }

  @Patch('sections/:sectionId')
  @Permissions('pages.update')
  updateSection(@Param('sectionId') sectionId: string, @Body() body: Partial<{ title: string; settings: Record<string, unknown>; position: number; enabled: boolean }>) {
    return this.pagesService.updateSection(sectionId, body);
  }

  @Delete('sections/:sectionId')
  @HttpCode(200)
  @Permissions('pages.update')
  removeSection(@Param('sectionId') sectionId: string) {
    return this.pagesService.removeSection(sectionId);
  }

  @Post(':id/reorder')
  @Permissions('pages.update')
  reorder(@Param('id') id: string, @Body() body: { orderedIds: string[] }) {
    return this.pagesService.reorderSections(id, body.orderedIds);
  }
}
