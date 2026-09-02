import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ServersService } from '../servers/servers.service';
import { ChatGateway } from '../gateway/chat.gateway';

const MESSAGE_SELECT = {
  id: true,
  channelId: true,
  content: true,
  createdAt: true,
  editedAt: true,
  attachmentUrl: true,
  attachmentType: true,
  author: { select: { id: true, displayName: true, avatarUrl: true } },
  reactions: { select: { emoji: true, userId: true } },
  replyTo: {
    select: {
      id: true,
      content: true,
      author: { select: { displayName: true } },
    },
  },
} as const;

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly servers: ServersService,
    private readonly gateway: ChatGateway,
  ) {}

  async list(userId: string, channelId: string, before?: string, limit = 50) {
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

  async create(
    userId: string,
    channelId: string,
    content: string,
    opts: { replyToId?: string; attachmentUrl?: string; attachmentType?: string } = {},
  ) {
    await this.assertAccess(userId, channelId);
    const message = await this.prisma.message.create({
      data: {
        channelId,
        authorId: userId,
        content: content.trim(),
        replyToId: opts.replyToId ?? null,
        attachmentUrl: opts.attachmentUrl ?? null,
        attachmentType: opts.attachmentType ?? null,
      },
      select: MESSAGE_SELECT,
    });
    this.gateway.broadcastMessage(channelId, message);
    return message;
  }

  async edit(userId: string, messageId: string, content: string) {
    const existing = await this.getOwned(userId, messageId);
    const message = await this.prisma.message.update({
      where: { id: messageId },
      data: { content: content.trim(), editedAt: new Date() },
      select: MESSAGE_SELECT,
    });
    if (existing.channelId)
      this.gateway.broadcastMessageUpdate(existing.channelId, message);
    return message;
  }

  async remove(userId: string, messageId: string) {
    const existing = await this.getOwned(userId, messageId);
    await this.prisma.message.delete({ where: { id: messageId } });
    if (existing.channelId)
      this.gateway.broadcastMessageDelete(existing.channelId, messageId);
    return { ok: true };
  }

  async toggleReaction(userId: string, messageId: string, emoji: string) {
    const msg = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: { channelId: true },
    });
    if (!msg?.channelId) throw new NotFoundException('message not found');
    await this.assertAccess(userId, msg.channelId);
    const existing = await this.prisma.reaction.findUnique({
      where: { messageId_userId_emoji: { messageId, userId, emoji } },
    });
    if (existing) {
      await this.prisma.reaction.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.reaction.create({ data: { messageId, userId, emoji } });
    }
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: MESSAGE_SELECT,
    });
    this.gateway.broadcastMessageUpdate(msg.channelId, message);
    return message;
  }

  private async getOwned(userId: string, messageId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: { authorId: true, channelId: true },
    });
    if (!message) throw new NotFoundException('message not found');
    if (message.authorId !== userId) {
      throw new ForbiddenException('not your message');
    }
    return message;
  }

  private async assertAccess(userId: string, channelId: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      select: { serverId: true },
    });
    if (!channel) throw new NotFoundException('channel not found');
    await this.servers.assertCanView(userId, channel.serverId);
  }
}
