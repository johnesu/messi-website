import { Body, Controller, Get, HttpCode, Param, Patch } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { Public, Permissions } from '../../common/decorators/auth.decorator';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Public()
  @Get('public')
  getPublic() {
    return this.settingsService.getPublic();
  }

  @Get()
  @Permissions('settings.manage')
  getAll() {
    return this.settingsService.getAll();
  }

  @Get('group/:group')
  getGroup(@Param('group') group: string) {
    return this.settingsService.getGroup(group);
  }

  @Patch()
  @HttpCode(200)
  @Permissions('settings.manage')
  update(@Body() body: { updates: Record<string, unknown>; group?: string }) {
    return this.settingsService.update(body.updates, body.group);
  }
}
