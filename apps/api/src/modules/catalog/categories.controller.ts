import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UsePipes,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Public, Permissions } from '../../common/decorators/auth.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { createCategorySchema } from '@mesi/validation';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @Get('tree')
  tree() {
    return this.categoriesService.findTree();
  }

  @Public()
  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Public()
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.categoriesService.findOne(slug);
  }

  @Post()
  @Permissions('products.create')
  @UsePipes(new ZodValidationPipe(createCategorySchema, () => 'body'))
  create(@Body() body: unknown) {
    return this.categoriesService.create(body as never);
  }

  @Patch(':id')
  @Permissions('products.update')
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.categoriesService.update(id, body as never);
  }

  @Delete(':id')
  @HttpCode(200)
  @Permissions('products.delete')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
