import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtCookieGuard } from '../auth/jwt-cookie.guard';
import { InvitesService } from './invites.service';

@Controller()
export class InvitesController {
  constructor(private readonly invites: InvitesService) {}

  @Post('servers/:serverId/invites')
  @UseGuards(JwtCookieGuard)
  create(
    @CurrentUser() user: User,
    @Param('serverId') serverId: string,
    @Body('maxUses') maxUses?: number,
    @Body('expiresInHours') expiresInHours?: number,
  ) {
    return this.invites.create(user.id, serverId, { maxUses, expiresInHours });
  }

  @Get('invites/:code')
  preview(@Param('code') code: string) {
    return this.invites.preview(code);
  }

  @Post('invites/:code/join')
  @UseGuards(JwtCookieGuard)
  join(@CurrentUser() user: User, @Param('code') code: string) {
    return this.invites.join(user.id, code);
  }
}
