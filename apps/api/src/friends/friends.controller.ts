import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtCookieGuard } from '../auth/jwt-cookie.guard';
import { FriendsService } from './friends.service';

@Controller('friends')
@UseGuards(JwtCookieGuard)
export class FriendsController {
  constructor(private readonly friends: FriendsService) {}

  @Get()
  list(@CurrentUser() user: User) {
    return this.friends.list(user.id);
  }

  @Post('requests')
  request(@CurrentUser() user: User, @Body('username') username: string) {
    if (!username?.trim()) throw new BadRequestException('username required');
    return this.friends.sendRequest(user.id, username);
  }

  @Post('requests/:id/accept')
  accept(@CurrentUser() user: User, @Param('id') id: string) {
    return this.friends.accept(user.id, id);
  }

  @Delete(':id')
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.friends.remove(user.id, id);
  }
}
