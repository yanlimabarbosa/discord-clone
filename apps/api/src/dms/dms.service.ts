import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatGateway } from '../gateway/chat.gateway';

function dmKeyFor(a: string, b: string): string {
  return [a, b].sort().join(':');
}

const PUBLIC_USER = {
  id: true,
  displayName: true,
  avatarUrl: true,
  isGuest: true,
  username: true,
} as const;

const DM_MESSAGE_SELECT = {
  id: true,
  conversationId: true,
  content: true,
  createdAt: true,
  editedAt: true,
  attachmentUrl: true,
  attachmentType: true,
  author: { select: { id: true, displayName: true, avatarUrl: true } },
} as const;

@Injectable()
export class DmsService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: ChatGateway,
  ) {}

  // Self-healing: merge any duplicate 1:1 conversations and backfill dmKey.
  // Idempotent — after the first run each pair has exactly one keyed row.
  async onModuleInit() {
    const convos = await this.prisma.conversation.findMany({
      include: { participants: { select: { userId: true } } },
    });
    const byPair = new Map<string, string[]>();
    for (const c of convos) {
      if (c.participants.length !== 2) continue;
      const key = dmKeyFor(c.participants[0].userId, c.participants[1].userId);
      const arr = byPair.get(key) ?? [];
      arr.push(c.id);
      byPair.set(key, arr);
    }
    for (const [key, ids] of byPair) {
      const [keep, ...rest] = ids;
      if (rest.length) {
        await this.prisma.message.updateMany({
          where: { conversationId: { in: rest } },
          data: { conversationId: keep },
        });
        await this.prisma.conversationParticipant.deleteMany({
          where: { conversationId: { in: rest } },
        });
        await this.prisma.conversation.deleteMany({
          where: { id: { in: rest } },
        });
      }
      await this.prisma.conversation
        .update({ where: { id: keep }, data: { dmKey: key } })
        .catch(() => undefined);
    }
  }

  async openWith(userId: string, otherUserId: string) {
    if (otherUserId === userId) {
      throw new BadRequestException("can't DM yourself");
    }
    const key = dmKeyFor(userId, otherUserId);
    const conv = await this.prisma.conversation.upsert({
      where: { dmKey: key },
      create: {
        dmKey: key,
        participants: { create: [{ userId }, { userId: otherUserId }] },
      },
      update: {},
    });
    return this.withOther(userId, conv.id);
  }

  async list(userId: string) {
    const convs = await this.prisma.conversation.findMany({
      where: { participants: { some: { userId } } },
      include: {
        participants: { include: { user: { select: PUBLIC_USER } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });
    return convs.map((c) => ({
      id: c.id,
      other: c.participants.find((p) => p.userId !== userId)?.user ?? null,
      lastMessage: c.messages[0]?.content ?? null,
    }));
  }

  async messages(userId: string, conversationId: string) {
    await this.assertParticipant(userId, conversationId);
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 100,
      select: DM_MESSAGE_SELECT,
    });
  }

  async send(
    userId: string,
    conversationId: string,
    content: string,
    opts: { attachmentUrl?: string; attachmentType?: string } = {},
  ) {
    await this.assertParticipant(userId, conversationId);
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        authorId: userId,
        content: content.trim(),
        attachmentUrl: opts.attachmentUrl ?? null,
        attachmentType: opts.attachmentType ?? null,
      },
      select: DM_MESSAGE_SELECT,
    });
    this.gateway.broadcastDm(conversationId, message);
    return message;
  }

  private async withOther(userId: string, conversationId: string) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: { include: { user: { select: PUBLIC_USER } } } },
    });
    return {
      id: conv!.id,
      other: conv!.participants.find((p) => p.userId !== userId)?.user ?? null,
    };
  }

  private async assertParticipant(userId: string, conversationId: string) {
    const p = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!p) throw new ForbiddenException('not in this conversation');
  }
}
