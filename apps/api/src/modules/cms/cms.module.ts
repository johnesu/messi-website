import { Module } from '@nestjs/common';
import { PagesService } from './pages.service';
import { PagesController } from './pages.controller';
import { BlogService } from './blog.service';
import { BlogController } from './blog.controller';

@Module({
  controllers: [PagesController, BlogController],
  providers: [PagesService, BlogService],
})
export class CmsModule {}
