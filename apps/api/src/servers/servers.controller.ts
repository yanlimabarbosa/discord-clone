import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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

  @Get('public')
  listPublic(@CurrentUser() user: User) {
    return this.servers.listPublic(user.id);
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

  @Post(':id/join')
  join(@CurrentUser() user: User, @Param('id') id: string) {
    return this.servers.join(user.id, id);
  }

  @Post(':id/leave')
  leave(@CurrentUser() user: User, @Param('id') id: string) {
    return this.servers.leave(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body('name') name?: string,
    @Body('isPublic') isPublic?: boolean,
  ) {
    if (typeof isPublic === 'boolean') {
      return this.servers.setPrivacy(user.id, id, isPublic);
    }
    if (name?.trim()) return this.servers.rename(user.id, id, name);
    throw new BadRequestException('nothing to update');
  }

  @Post(':id/icon')
  @UseInterceptors(FileInterceptor('file'))
  icon(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @UploadedFile() file: { originalname: string; buffer: Buffer },
  ) {
    if (!file) throw new BadRequestException('file required');
    return this.servers.setIconFromFile(user.id, id, file);
  }

  @Delete(':id')
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.servers.remove(user.id, id);
  }

  @Delete(':id/members/:userId')
  kick(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Param('userId') targetId: string,
  ) {
    return this.servers.kick(user.id, id, targetId);
  }

  @Post(':id/bans/:userId')
  ban(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Param('userId') targetId: string,
  ) {
    return this.servers.ban(user.id, id, targetId);
  }
}
