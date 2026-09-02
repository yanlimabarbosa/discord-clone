import { Injectable, NotFoundException } from '@nestjs/common';
import { ChannelType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ServersService } from '../servers/servers.service';

@Injectable()
export class ChannelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly servers: ServersService,
  ) {}

  async listForServer(userId: string, serverId: string) {
    await this.servers.assertMember(userId, serverId);
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
    await this.servers.assertMember(userId, serverId);
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

  private async getOwnedServerChannel(userId: string, channelId: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });
    if (!channel) throw new NotFoundException('channel not found');
    await this.servers.assertMember(userId, channel.serverId);
    return channel;
  }
}
