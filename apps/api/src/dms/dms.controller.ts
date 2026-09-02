import {
  BadRequestException,
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
import { DmsService } from './dms.service';

@Controller('dms')
@UseGuards(JwtCookieGuard)
export class DmsController {
  constructor(private readonly dms: DmsService) {}

  @Get()
  list(@CurrentUser() user: User) {
    return this.dms.list(user.id);
  }

  @Post()
  open(@CurrentUser() user: User, @Body('userId') otherUserId: string) {
    if (!otherUserId) throw new BadRequestException('userId required');
    return this.dms.openWith(user.id, otherUserId);
  }

  @Get(':id/messages')
  messages(@CurrentUser() user: User, @Param('id') id: string) {
    return this.dms.messages(user.id, id);
  }

  @Post(':id/messages')
  send(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body('content') content: string,
  ) {
    if (!content?.trim()) throw new BadRequestException('content required');
    return this.dms.send(user.id, id, content);
  }
}
