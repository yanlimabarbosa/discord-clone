import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtCookieGuard } from '../auth/jwt-cookie.guard';
import { RolesService } from './roles.service';

@Controller()
@UseGuards(JwtCookieGuard)
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  @Get('servers/:serverId/roles')
  list(@CurrentUser() user: User, @Param('serverId') serverId: string) {
    return this.roles.list(user.id, serverId);
  }

  @Get('servers/:serverId/permissions')
  myPermissions(
    @CurrentUser() user: User,
    @Param('serverId') serverId: string,
  ) {
    return this.roles.myPermissions(user.id, serverId);
  }

  @Post('servers/:serverId/roles')
  create(
    @CurrentUser() user: User,
    @Param('serverId') serverId: string,
    @Body() body: { name?: string; color?: string; permissions?: number },
  ) {
    return this.roles.create(user.id, serverId, body);
  }

  @Patch('roles/:roleId')
  update(
    @CurrentUser() user: User,
    @Param('roleId') roleId: string,
    @Body() body: { name?: string; color?: string; permissions?: number },
  ) {
    return this.roles.update(user.id, roleId, body);
  }

  @Delete('roles/:roleId')
  remove(@CurrentUser() user: User, @Param('roleId') roleId: string) {
    return this.roles.remove(user.id, roleId);
  }

  @Post('roles/:roleId/members/:userId')
  assign(
    @CurrentUser() user: User,
    @Param('roleId') roleId: string,
    @Param('userId') targetUserId: string,
  ) {
    return this.roles.assign(user.id, roleId, targetUserId);
  }

  @Delete('roles/:roleId/members/:userId')
  unassign(
    @CurrentUser() user: User,
    @Param('roleId') roleId: string,
    @Param('userId') targetUserId: string,
  ) {
    return this.roles.unassign(user.id, roleId, targetUserId);
  }
}
