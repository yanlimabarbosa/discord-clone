import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtCookieGuard } from '../auth/jwt-cookie.guard';
import { VoiceModerationService } from './voice-moderation.service';

@Controller('servers/:serverId/voice')
@UseGuards(JwtCookieGuard)
export class VoiceModerationController {
  constructor(private readonly voice: VoiceModerationService) {}

  @Post('move')
  move(
    @CurrentUser() user: User,
    @Param('serverId') serverId: string,
    @Body('userId') targetUserId: string,
    @Body('channelId') channelId: string,
  ) {
    if (!targetUserId || !channelId) {
      throw new BadRequestException('userId and channelId required');
    }
    return this.voice.move(user.id, serverId, targetUserId, channelId);
  }

  @Post('mute')
  mute(
    @CurrentUser() user: User,
    @Param('serverId') serverId: string,
    @Body('userId') targetUserId: string,
    @Body('muted') muted: boolean,
  ) {
    if (!targetUserId) throw new BadRequestException('userId required');
    return this.voice.setMute(user.id, serverId, targetUserId, !!muted);
  }

  @Post('deafen')
  deafen(
    @CurrentUser() user: User,
    @Param('serverId') serverId: string,
    @Body('userId') targetUserId: string,
    @Body('deafened') deafened: boolean,
  ) {
    if (!targetUserId) throw new BadRequestException('userId required');
    return this.voice.setDeafen(user.id, serverId, targetUserId, !!deafened);
  }
}
