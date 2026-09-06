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
  UsePipes,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public, Permissions } from '../../common/decorators/auth.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { createReviewSchema } from '@mesi/validation';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Public()
  @Get('product/:productId')
  productReviews(@Param('productId') productId: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.reviewsService.productReviews(productId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('mine')
  mine(@CurrentUser('id') userId: string) {
    return this.reviewsService.myReviews(userId);
  }

  @Get('admin/all')
  @Permissions('reviews.moderate')
  adminList(@Query('page') page?: string, @Query('limit') limit?: string, @Query('status') status?: string) {
    return this.reviewsService.adminList({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
    });
  }

  @Post()
  @UsePipes(new ZodValidationPipe(createReviewSchema, () => 'body'))
  create(@CurrentUser('id') userId: string, @Body() body: unknown) {
    return this.reviewsService.create(userId, body as never);
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() body: { rating?: number; title?: string; body?: string; images?: string[] },
  ) {
    return this.reviewsService.update(userId, id, body);
  }

  @Delete(':id')
  @HttpCode(200)
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.reviewsService.remove(userId, id);
  }

  @Patch(':id/moderate')
  @Permissions('reviews.moderate')
  moderate(@Param('id') id: string, @Body() body: { status: 'APPROVED' | 'REJECTED' }) {
    return this.reviewsService.moderate(id, body.status);
  }

  @Patch(':id/respond')
  @Permissions('reviews.moderate')
  respond(@Param('id') id: string, @Body() body: { response: string }) {
    return this.reviewsService.adminRespond(id, body.response);
  }

  @Delete(':id/admin')
  @HttpCode(200)
  @Permissions('reviews.moderate')
  deleteAdmin(@Param('id') id: string) {
    return this.reviewsService.deleteAdmin(id);
  }
}
