import { Body, Controller, Get, HttpCode, Param, Patch, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { Permissions } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Permissions('users.manage')
  list(@Query('page') page?: string, @Query('limit') limit?: string, @Query('q') q?: string, @Query('role') role?: string) {
    return this.usersService.list({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      q,
      role,
    });
  }

  @Get('roles')
  @Permissions('users.manage')
  roles() {
    return this.usersService.roles();
  }

  @Get(':id')
  @Permissions('users.manage')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id/roles')
  @HttpCode(200)
  @Permissions('users.manage')
  setRoles(
    @Param('id') id: string,
    @Body() body: { roles: string[] },
    @CurrentUser('id') actorId: string,
    @Req() req: Request,
  ) {
    return this.usersService.setRoles(id, body.roles, actorId, req);
  }

  @Patch(':id/status')
  @HttpCode(200)
  @Permissions('users.manage')
  setActive(
    @Param('id') id: string,
    @Body() body: { isActive: boolean },
    @CurrentUser('id') actorId: string,
    @Req() req: Request,
  ) {
    return this.usersService.setActive(id, body.isActive, actorId, req);
  }
}
