import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtCookieGuard } from '../auth/jwt-cookie.guard';
import { MembersService } from './members.service';

@Controller('servers/:serverId/members')
@UseGuards(JwtCookieGuard)
export class MembersController {
  constructor(private readonly members: MembersService) {}

  @Get()
  list(@CurrentUser() user: User, @Param('serverId') serverId: string) {
    return this.members.list(user.id, serverId);
  }
}
