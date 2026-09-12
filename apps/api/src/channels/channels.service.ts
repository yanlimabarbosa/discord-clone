import { Injectable, NotFoundException } from '@nestjs/common';
import { ChannelType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ServersService } from '../servers/servers.service';
import { PermissionsService } from '../permissions/permissions.service';
import { Permissions } from '../permissions/permissions';

@Injectable()
export class ChannelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly servers: ServersService,
    private readonly permissions: PermissionsService,
  ) {}

  async listForServer(userId: string, serverId: string) {
    await this.servers.assertCanView(userId, serverId);
    return this.prisma.channel.findMany({
      where: { serverId },
      orderBy: { position: 'asc' },
    });
  }

  async create(
    userId: string,
    serverId: string,
    name: string,
    type: ChannelType,
  ) {
    await this.permissions.assert(userId, serverId, Permissions.MANAGE_CHANNELS);
    const count = await this.prisma.channel.count({ where: { serverId } });
    return this.prisma.channel.create({
      data: { serverId, name: name.trim(), type, position: count },
    });
  }

  async update(
    userId: string,
    channelId: string,
    patch: { name?: string; icon?: string | null },
  ) {
    const channel = await this.getOwnedServerChannel(userId, channelId);
    return this.prisma.channel.update({
      where: { id: channel.id },
      data: {
        ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
        ...(patch.icon !== undefined ? { icon: patch.icon || null } : {}),
      },
    });
  }

  async remove(userId: string, channelId: string) {
    const channel = await this.getOwnedServerChannel(userId, channelId);
    await this.prisma.channel.delete({ where: { id: channel.id } });
    return { ok: true };
  }

  async listCategories(userId: string, serverId: string) {
    await this.servers.assertCanView(userId, serverId);
    return this.prisma.channelCategory.findMany({
      where: { serverId },
      orderBy: { position: 'asc' },
    });
  }

  async createCategory(userId: string, serverId: string, name: string) {
    await this.permissions.assert(userId, serverId, Permissions.MANAGE_CHANNELS);
    const count = await this.prisma.channelCategory.count({
      where: { serverId },
    });
    return this.prisma.channelCategory.create({
      data: { serverId, name: name.trim(), position: count },
    });
  }

  async renameCategory(userId: string, categoryId: string, name: string) {
    const category = await this.getCategory(userId, categoryId);
    return this.prisma.channelCategory.update({
      where: { id: category.id },
      data: { name: name.trim() },
    });
  }

  async deleteCategory(userId: string, categoryId: string) {
    const category = await this.getCategory(userId, categoryId);
    await this.prisma.$transaction([
      this.prisma.channel.updateMany({
        where: { categoryId: category.id },
        data: { categoryId: null },
      }),
      this.prisma.channelCategory.delete({ where: { id: category.id } }),
    ]);
    return { ok: true };
  }

  async reorder(
    userId: string,
    serverId: string,
    items: { id: string; categoryId: string | null; position: number }[],
  ) {
    await this.permissions.assert(userId, serverId, Permissions.MANAGE_CHANNELS);
    const owned = await this.prisma.channel.findMany({
      where: { serverId },
      select: { id: true },
    });
    const validIds = new Set(owned.map((c) => c.id));
    const updates = items
      .filter((i) => validIds.has(i.id))
      .map((i) =>
        this.prisma.channel.update({
          where: { id: i.id },
          data: { categoryId: i.categoryId ?? null, position: i.position },
        }),
      );
    await this.prisma.$transaction(updates);
    return this.listForServer(userId, serverId);
  }

  private async getCategory(userId: string, categoryId: string) {
    const category = await this.prisma.channelCategory.findUnique({
      where: { id: categoryId },
    });
    if (!category) throw new NotFoundException('category not found');
    await this.permissions.assert(
      userId,
      category.serverId,
      Permissions.MANAGE_CHANNELS,
    );
    return category;
  }

  private async getOwnedServerChannel(userId: string, channelId: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });
    if (!channel) throw new NotFoundException('channel not found');
    await this.permissions.assert(
      userId,
      channel.serverId,
      Permissions.MANAGE_CHANNELS,
    );
    return channel;
  }
}
