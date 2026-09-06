import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  get(@CurrentUser('id') userId: string) {
    return this.wishlistService.get(userId);
  }

  @Post()
  @HttpCode(200)
  add(
    @CurrentUser('id') userId: string,
    @Body() body: { productId?: string | null; variantId?: string | null },
  ) {
    return this.wishlistService.add(userId, body);
  }

  @Delete(':itemId')
  @HttpCode(200)
  remove(@CurrentUser('id') userId: string, @Param('itemId') itemId: string) {
    return this.wishlistService.remove(userId, itemId);
  }

  @Post(':itemId/move-to-cart')
  @HttpCode(200)
  moveToCart(
    @CurrentUser('id') userId: string,
    @Param('itemId') itemId: string,
    @Body() body: { quantity?: number },
  ) {
    return this.wishlistService.moveToCart(userId, itemId, body.quantity ?? 1);
  }
}
