import { Body, Controller, Get, HttpCode, Param, Post, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public, Permissions } from '../../common/decorators/auth.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initialize/:orderId')
  initialize(@Param('orderId') orderId: string, @CurrentUser('id') userId?: string) {
    return this.paymentsService.initialize(orderId, userId);
  }

  @Public()
  @Post('verify/:reference')
  verify(@Param('reference') reference: string) {
    return this.paymentsService.verifyAndConfirm(reference);
  }

  @Public()
  @Post('webhook/paystack')
  webhook(@Body() body: unknown, @Req() req: Request) {
    const signature = (req.headers['x-paystack-signature'] as string) ?? undefined;
    return this.paymentsService.handleWebhook(body, signature);
  }

  @Get('transactions')
  @Permissions('payments.refund')
  transactions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.paymentsService.listTransactions({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
    });
  }

  @Post('refund')
  @HttpCode(200)
  @Permissions('payments.refund')
  refund(
    @Body() body: { orderId: string; amount?: number; reason?: string },
    @CurrentUser('id') actorId: string | undefined,
    @Req() req: Request,
  ) {
    return this.paymentsService.refund({
      orderId: body.orderId,
      amount: body.amount,
      reason: body.reason,
      actorId: actorId ?? '',
      req,
    });
  }
}
