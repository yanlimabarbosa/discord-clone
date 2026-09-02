import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ChannelType, User } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtCookieGuard } from '../auth/jwt-cookie.guard';
import { ChannelsService } from './channels.service';

@Controller()
@UseGuards(JwtCookieGuard)
export class ChannelsController {
  constructor(private readonly channels: ChannelsService) {}

  @Get('servers/:serverId/channels')
  list(@CurrentUser() user: User, @Param('serverId') serverId: string) {
    return this.channels.listForServer(user.id, serverId);
  }

  @Post('servers/:serverId/channels')
  create(
    @CurrentUser() user: User,
    @Param('serverId') serverId: string,
    @Body('name') name: string,
    @Body('type') type: ChannelType,
  ) {
    if (!name?.trim()) throw new BadRequestException('channel name required');
    const channelType: ChannelType = type === 'VOICE' ? 'VOICE' : 'TEXT';
    return this.channels.create(user.id, serverId, name, channelType);
  }
}
