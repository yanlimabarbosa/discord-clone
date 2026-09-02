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
import { ServersService } from './servers.service';

@Controller('servers')
@UseGuards(JwtCookieGuard)
export class ServersController {
  constructor(private readonly servers: ServersService) {}

  @Get()
  list(@CurrentUser() user: User) {
    return this.servers.listForUser(user.id);
  }

  @Post()
  create(@CurrentUser() user: User, @Body('name') name: string) {
    if (!name?.trim()) throw new BadRequestException('server name required');
    return this.servers.create(user.id, name);
  }

  @Get(':id')
  get(@CurrentUser() user: User, @Param('id') id: string) {
    return this.servers.getWithChannels(user.id, id);
  }
}
