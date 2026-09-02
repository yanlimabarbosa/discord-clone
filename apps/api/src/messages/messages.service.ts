import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ServersService } from '../servers/servers.service';
import { ChatGateway } from '../gateway/chat.gateway';

const MESSAGE_SELECT = {
  id: true,
  channelId: true,
  content: true,
  createdAt: true,
  author: { select: { id: true, displayName: true, avatarUrl: true } },
} as const;

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly servers: ServersService,
    private readonly gateway: ChatGateway,
  ) {}

  async list(
    userId: string,
    channelId: string,
    before?: string,
    limit = 50,
  ) {
    await this.assertAccess(userId, channelId);
    const messages = await this.prisma.message.findMany({
      where: { channelId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      ...(before ? { cursor: { id: before }, skip: 1 } : {}),
      select: MESSAGE_SELECT,
    });
    return messages.reverse();
  }

  async create(userId: string, channelId: string, content: string) {
    await this.assertAccess(userId, channelId);
    const message = await this.prisma.message.create({
      data: { channelId, authorId: userId, content: content.trim() },
      select: MESSAGE_SELECT,
    });
    this.gateway.broadcastMessage(channelId, message);
    return message;
  }

  private async assertAccess(userId: string, channelId: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      select: { serverId: true },
    });
    if (!channel) throw new NotFoundException('channel not found');
    await this.servers.assertMember(userId, channel.serverId);
  }
}
