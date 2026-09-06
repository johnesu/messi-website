import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UsePipes } from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { addressSchema } from '@mesi/validation';

@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  list(@CurrentUser('id') userId: string) {
    return this.addressesService.list(userId);
  }

  @Post()
  @UsePipes(new ZodValidationPipe(addressSchema, () => 'body'))
  create(@CurrentUser('id') userId: string, @Body() body: unknown) {
    return this.addressesService.create(userId, body as never);
  }

  @Patch(':id')
  update(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() body: unknown) {
    return this.addressesService.update(userId, id, body as never);
  }

  @Delete(':id')
  @HttpCode(200)
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.addressesService.remove(userId, id);
  }
}
