import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtCookieGuard } from '../auth/jwt-cookie.guard';
import { ReadStatesService } from './read-states.service';

@Controller()
@UseGuards(JwtCookieGuard)
export class ReadStatesController {
  constructor(private readonly readStates: ReadStatesService) {}

  @Get('servers/:serverId/unread')
  summary(@CurrentUser() user: User, @Param('serverId') serverId: string) {
    return this.readStates.summary(user.id, serverId);
  }

  @Post('channels/:channelId/read')
  markRead(@CurrentUser() user: User, @Param('channelId') channelId: string) {
    return this.readStates.markRead(user.id, channelId);
  }
}
