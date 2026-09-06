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
import { BlogService } from './blog.service';
import { Public, Permissions } from '../../common/decorators/auth.decorator';

@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Public()
  @Get()
  listPublic(@Query('page') page?: string, @Query('limit') limit?: string, @Query('category') category?: string, @Query('q') q?: string) {
    return this.blogService.listPublic({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      category,
      q,
    });
  }

  @Public()
  @Get('categories')
  categories() {
    return this.blogService.categories();
  }

  @Public()
  @Get('public/:slug')
  publicPost(@Param('slug') slug: string) {
    return this.blogService.getPublicBySlug(slug);
  }

  @Get('admin/all')
  @Permissions('blog.view')
  adminList(@Query('page') page?: string, @Query('limit') limit?: string, @Query('status') status?: string, @Query('q') q?: string) {
    return this.blogService.adminList({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
      q,
    });
  }

  @Post('categories')
  @Permissions('blog.manage')
  createCategory(@Body() body: { name: string; slug?: string }) {
    return this.blogService.createCategory(body);
  }

  @Get(':id')
  @Permissions('blog.view')
  findOne(@Param('id') id: string) {
    return this.blogService.findOne(id);
  }

  @Post()
  @Permissions('blog.manage')
  create(@Body() body: Parameters<BlogService['create']>[0]) {
    return this.blogService.create(body);
  }

  @Patch(':id')
  @Permissions('blog.manage')
  update(@Param('id') id: string, @Body() body: Parameters<BlogService['update']>[1]) {
    return this.blogService.update(id, body);
  }

  @Post(':id/publish')
  @Permissions('blog.manage')
  publish(@Param('id') id: string) {
    return this.blogService.publish(id);
  }

  @Delete(':id')
  @HttpCode(200)
  @Permissions('blog.manage')
  remove(@Param('id') id: string) {
    return this.blogService.remove(id);
  }
}
