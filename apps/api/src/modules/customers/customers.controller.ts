import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { Permissions } from '../../common/decorators/auth.decorator';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @Permissions('customers.view')
  list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('segment') segment?: string,
    @Query('tier') tier?: string,
    @Query('q') q?: string,
  ) {
    return this.customersService.list({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      segment,
      tier,
      q,
    });
  }

  @Post('compute-segments')
  @Permissions('customers.view')
  computeSegments() {
    return this.customersService.computeSegments();
  }

  @Get(':id')
  @Permissions('customers.view')
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Patch(':id')
  @Permissions('customers.update')
  update(
    @Param('id') id: string,
    @Body() body: Partial<{ tier: string; segment: string; notes: string; tags: string[] }>,
  ) {
    return this.customersService.update(id, body);
  }
}
