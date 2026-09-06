import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { BrandsService } from './brands.service';
import { Public, Permissions } from '../../common/decorators/auth.decorator';

@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Public()
  @Get()
  findAll() {
    return this.brandsService.findAll();
  }

  @Public()
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.brandsService.findOne(slug);
  }

  @Post()
  @Permissions('products.create')
  create(@Body() body: { name: string; slug?: string; description?: string; logoUrl?: string }) {
    return this.brandsService.create(body);
  }

  @Patch(':id')
  @Permissions('products.update')
  update(
    @Param('id') id: string,
    @Body() body: Partial<{ name: string; description: string; logoUrl: string }>,
  ) {
    return this.brandsService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(200)
  @Permissions('products.delete')
  remove(@Param('id') id: string) {
    return this.brandsService.remove(id);
  }
}
