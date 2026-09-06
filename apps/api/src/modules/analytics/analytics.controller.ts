import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { Permissions } from '../../common/decorators/auth.decorator';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @Permissions('analytics.view')
  dashboard(@Query('from') from?: string, @Query('to') to?: string) {
    return this.analyticsService.dashboard({ from, to });
  }

  @Get('revenue')
  @Permissions('analytics.view')
  revenue(@Query('from') from?: string, @Query('to') to?: string) {
    return this.analyticsService.revenueByDay(from, to);
  }

  @Get('sales-by-category')
  @Permissions('analytics.view')
  salesByCategory(@Query('from') from?: string, @Query('to') to?: string) {
    return this.analyticsService.salesByCategory({ from, to });
  }
}
