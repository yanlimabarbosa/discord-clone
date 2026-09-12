import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ServersService } from '../servers/servers.service';

export type ChannelUnread = { unread: boolean; mentions: number };

@Injectable()
export class ReadStatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly servers: ServersService,
  ) {}

  async summary(
    userId: string,
    serverId: string,
  ): Promise<Record<string, ChannelUnread>> {
    await this.servers.assertCanView(userId, serverId);
    const [channels, states, me] = await Promise.all([
      this.prisma.channel.findMany({
        where: { serverId, type: 'TEXT' },
        select: { id: true },
      }),
      this.prisma.readState.findMany({ where: { userId } }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { displayName: true },
      }),
    ]);
    const lastReadByChannel = new Map(
      states.map((s) => [s.channelId, s.lastReadAt]),
    );
    const myTag = `@${(me?.displayName ?? '').toLowerCase()}`;

    const result: Record<string, ChannelUnread> = {};
    await Promise.all(
      channels.map(async (ch) => {
        const lastReadAt = lastReadByChannel.get(ch.id) ?? new Date(0);
        const unreadMsgs = await this.prisma.message.findMany({
          where: {
            channelId: ch.id,
            createdAt: { gt: lastReadAt },
            authorId: { not: userId },
          },
          select: { content: true },
        });
        const mentions = unreadMsgs.filter((m) => {
          const lower = m.content.toLowerCase();
          return (
            lower.includes('@everyone') ||
            lower.includes('@here') ||
            (myTag !== '@' && lower.includes(myTag))
          );
        }).length;
        result[ch.id] = { unread: unreadMsgs.length > 0, mentions };
      }),
    );
    return result;
  }

  async markRead(userId: string, channelId: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      select: { serverId: true },
    });
    if (!channel) throw new NotFoundException('channel not found');
    await this.servers.assertCanView(userId, channel.serverId);
    await this.prisma.readState.upsert({
      where: { userId_channelId: { userId, channelId } },
      create: { userId, channelId, lastReadAt: new Date() },
      update: { lastReadAt: new Date() },
    });
    return { ok: true };
  }
}
