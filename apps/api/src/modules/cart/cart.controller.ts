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
import { CartService } from './cart.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { addToCartSchema, updateCartItemSchema, applyCouponSchema } from '@mesi/validation';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(
    @CurrentUser('id') userId: string | undefined,
    @Query('sessionKey') sessionKey?: string,
    @Query('shippingMethodId') shippingMethodId?: string,
  ) {
    return this.cartService.getCart(userId, sessionKey, shippingMethodId);
  }

  @Post('items')
  @UsePipes(new ZodValidationPipe(addToCartSchema, () => 'body'))
  addItem(
    @CurrentUser('id') userId: string | undefined,
    @Body() body: { productId?: string | null; variantId?: string | null; quantity: number; sessionKey?: string },
  ) {
    const { sessionKey, ...input } = body;
    return this.cartService.addItem(userId, sessionKey ?? this.genKey(), input);
  }

  @Patch('items/:itemId')
  @UsePipes(new ZodValidationPipe(updateCartItemSchema, () => 'body'))
  updateItem(
    @CurrentUser('id') userId: string | undefined,
    @Param('itemId') itemId: string,
    @Body() body: { quantity: number; sessionKey?: string },
  ) {
    return this.cartService.updateItem(userId, body.sessionKey, itemId, body.quantity);
  }

  @Delete('items/:itemId')
  @HttpCode(200)
  removeItem(
    @CurrentUser('id') userId: string | undefined,
    @Param('itemId') itemId: string,
    @Query('sessionKey') sessionKey?: string,
  ) {
    return this.cartService.removeItem(userId, sessionKey, itemId);
  }

  @Post('coupon')
  @UsePipes(new ZodValidationPipe(applyCouponSchema, () => 'body'))
  applyCoupon(
    @CurrentUser('id') userId: string | undefined,
    @Body() body: { code: string; sessionKey?: string },
  ) {
    return this.cartService.applyCoupon(userId, body.sessionKey, body.code);
  }

  @Delete('coupon')
  @HttpCode(200)
  removeCoupon(
    @CurrentUser('id') userId: string | undefined,
    @Query('sessionKey') sessionKey?: string,
  ) {
    return this.cartService.removeCoupon(userId, sessionKey);
  }

  @Post('merge')
  @HttpCode(200)
  merge(@CurrentUser('id') userId: string, @Body() body: { sessionKey?: string }) {
    return this.cartService.merge(userId, body.sessionKey);
  }

  @Delete()
  @HttpCode(200)
  clear(
    @CurrentUser('id') userId: string | undefined,
    @Query('sessionKey') sessionKey?: string,
  ) {
    return this.cartService.clear(userId, sessionKey);
  }

  private genKey(): string {
    return `anon-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  }
}
