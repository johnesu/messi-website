import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaystackProvider } from './paystack.provider';
import { OrdersModule } from '../orders/orders.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [OrdersModule, InventoryModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaystackProvider],
  exports: [PaymentsService],
})
export class PaymentsModule {}
