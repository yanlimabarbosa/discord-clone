import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtCookieGuard } from '../auth/jwt-cookie.guard';
import { LivekitService } from './livekit.service';

@Controller('livekit')
@UseGuards(JwtCookieGuard)
export class LivekitController {
  constructor(private readonly livekit: LivekitService) {}

  @Post('token')
  async token(
    @CurrentUser() user: User,
    @Body('channelId') channelId: string,
  ) {
    const token = await this.livekit.createChannelToken(
      user.id,
      channelId,
      user.displayName,
    );
    return { token };
  }
}
