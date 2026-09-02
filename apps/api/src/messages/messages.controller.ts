import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtCookieGuard } from '../auth/jwt-cookie.guard';
import { MessagesService } from './messages.service';

@Controller('channels/:channelId/messages')
@UseGuards(JwtCookieGuard)
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Get()
  list(
    @CurrentUser() user: User,
    @Param('channelId') channelId: string,
    @Query('before') before?: string,
  ) {
    return this.messages.list(user.id, channelId, before);
  }

  @Post()
  create(
    @CurrentUser() user: User,
    @Param('channelId') channelId: string,
    @Body('content') content: string,
  ) {
    if (!content?.trim()) throw new BadRequestException('content required');
    if (content.length > 4000) {
      throw new BadRequestException('message too long');
    }
    return this.messages.create(user.id, channelId, content);
  }
}
