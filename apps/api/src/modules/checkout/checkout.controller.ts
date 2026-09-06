import { Body, Controller, Get, Post, Query, UsePipes } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/auth.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { checkoutSchema } from '@mesi/validation';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Public()
  @Get('shipping-methods')
  shippingMethods() {
    return this.checkoutService.getShippingMethods();
  }

  @Post()
  @UsePipes(new ZodValidationPipe(checkoutSchema, () => 'body'))
  checkout(
    @Body() body: unknown,
    @CurrentUser('id') userId: string | undefined,
    @Query('sessionKey') sessionKey?: string,
  ) {
    return this.checkoutService.begin(body as never, userId, sessionKey);
  }
}
