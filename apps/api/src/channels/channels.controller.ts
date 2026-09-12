import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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

  @Patch('channels/:channelId')
  update(
    @CurrentUser() user: User,
    @Param('channelId') channelId: string,
    @Body('name') name?: string,
    @Body('icon') icon?: string,
  ) {
    return this.channels.update(user.id, channelId, { name, icon });
  }

  @Delete('channels/:channelId')
  remove(@CurrentUser() user: User, @Param('channelId') channelId: string) {
    return this.channels.remove(user.id, channelId);
  }

  @Get('servers/:serverId/categories')
  listCategories(
    @CurrentUser() user: User,
    @Param('serverId') serverId: string,
  ) {
    return this.channels.listCategories(user.id, serverId);
  }

  @Post('servers/:serverId/categories')
  createCategory(
    @CurrentUser() user: User,
    @Param('serverId') serverId: string,
    @Body('name') name: string,
  ) {
    if (!name?.trim()) throw new BadRequestException('category name required');
    return this.channels.createCategory(user.id, serverId, name);
  }

  @Patch('categories/:categoryId')
  renameCategory(
    @CurrentUser() user: User,
    @Param('categoryId') categoryId: string,
    @Body('name') name: string,
  ) {
    if (!name?.trim()) throw new BadRequestException('category name required');
    return this.channels.renameCategory(user.id, categoryId, name);
  }

  @Delete('categories/:categoryId')
  deleteCategory(
    @CurrentUser() user: User,
    @Param('categoryId') categoryId: string,
  ) {
    return this.channels.deleteCategory(user.id, categoryId);
  }

  @Patch('servers/:serverId/channels/reorder')
  reorder(
    @CurrentUser() user: User,
    @Param('serverId') serverId: string,
    @Body('items')
    items: { id: string; categoryId: string | null; position: number }[],
  ) {
    if (!Array.isArray(items)) throw new BadRequestException('items required');
    return this.channels.reorder(user.id, serverId, items);
  }
}
