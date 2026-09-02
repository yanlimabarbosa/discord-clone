import { Injectable } from '@nestjs/common';
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
}
