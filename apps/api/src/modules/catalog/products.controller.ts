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
  Req,
  UsePipes,
} from '@nestjs/common';
import { Request } from 'express';
import { ProductsService } from './products.service';
import { Public, Permissions } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  createProductSchema,
  updateProductSchema,
  productSearchQuery,
} from '@mesi/validation';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Public()
  @Get()
  search(@Query() query: unknown) {
    return this.productsService.search(productSearchQuery.parse(query) as never);
  }

  @Get('admin')
  findAll(@Query() query: { page?: number; limit?: number; status?: string; q?: string; category?: string }) {
    return this.productsService.findAll(query);
  }

  @Public()
  @Get('related')
  related(@Query('id') id: string, @Query('limit') limit?: string) {
    return this.productsService.findRelated(id, undefined, limit ? Number(limit) : 4);
  }

  @Get(':idOrSlug')
  findOne(@Param('idOrSlug') idOrSlug: string) {
    return this.productsService.findOne(idOrSlug, 'admin');
  }

  @Public()
  @Get('public/:idOrSlug')
  findPublic(@Param('idOrSlug') idOrSlug: string) {
    return this.productsService.findOne(idOrSlug);
  }

  @Post()
  @UsePipes(new ZodValidationPipe(createProductSchema, () => 'body'))
  @Permissions('products.create')
  create(
    @Body() body: unknown,
    @CurrentUser('id') actorId: string,
    @Req() req: Request,
  ) {
    return this.productsService.create(body as never, actorId, req);
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(updateProductSchema, () => 'body'))
  @Permissions('products.update')
  update(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser('id') actorId: string,
    @Req() req: Request,
  ) {
    return this.productsService.update(id, body as never, actorId, req);
  }

  @Delete(':id')
  @HttpCode(200)
  @Permissions('products.delete')
  remove(@Param('id') id: string, @CurrentUser('id') actorId: string, @Req() req: Request) {
    return this.productsService.remove(id, actorId, req);
  }
}
