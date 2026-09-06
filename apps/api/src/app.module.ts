import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './common/prisma/prisma.module';
import { EmailModule } from './modules/email/email.module';
import { AuditModule } from './modules/audit/audit.module';
import { PricingModule } from './common/services/pricing.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { AuthModule } from './modules/auth/auth.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { CartModule } from './modules/cart/cart.module';
import { CheckoutModule } from './modules/checkout/checkout.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { AddressesModule } from './modules/addresses/addresses.module';
import { CustomersModule } from './modules/customers/customers.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { UsersModule } from './modules/users/users.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { MediaModule } from './modules/media/media.module';
import { SettingsModule } from './modules/settings/settings.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { CmsModule } from './modules/cms/cms.module';
import { loadEnv } from '@mesi/config';

const env = loadEnv();

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: env.RATE_LIMIT_TTL * 1000,
        limit: env.RATE_LIMIT_MAX,
      },
    ]),
    JwtModule.register({
      secret: env.JWT_ACCESS_SECRET,
    }),
    PrismaModule,
    EmailModule,
    AuditModule,
    PricingModule,
    AuthModule,
    CatalogModule,
    CartModule,
    CheckoutModule,
    OrdersModule,
    PaymentsModule,
    InventoryModule,
    WishlistModule,
    AddressesModule,
    CustomersModule,
    ReviewsModule,
    CouponsModule,
    UsersModule,
    NotificationsModule,
    MediaModule,
    SettingsModule,
    AnalyticsModule,
    CmsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
