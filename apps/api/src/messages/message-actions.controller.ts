import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtCookieGuard } from '../auth/jwt-cookie.guard';
import { MessagesService } from './messages.service';

@Controller('messages')
@UseGuards(JwtCookieGuard)
export class MessageActionsController {
  constructor(private readonly messages: MessagesService) {}

  @Patch(':id')
  edit(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body('content') content: string,
  ) {
    if (!content?.trim()) throw new BadRequestException('content required');
    return this.messages.edit(user.id, id, content);
  }

  @Delete(':id')
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.messages.remove(user.id, id);
  }

  @Post(':id/reactions')
  react(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body('emoji') emoji: string,
  ) {
    if (!emoji) throw new BadRequestException('emoji required');
    return this.messages.toggleReaction(user.id, id, emoji);
  }
}
