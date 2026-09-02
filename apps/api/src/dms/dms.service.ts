import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatGateway } from '../gateway/chat.gateway';

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
  author: { select: { id: true, displayName: true, avatarUrl: true } },
} as const;

@Injectable()
export class DmsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: ChatGateway,
  ) {}

  async openWith(userId: string, otherUserId: string) {
    if (otherUserId === userId) {
      throw new BadRequestException("can't DM yourself");
    }
    const existing = await this.prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: otherUserId } } },
        ],
      },
    });
    const conv =
      existing ??
      (await this.prisma.conversation.create({
        data: {
          participants: {
            create: [{ userId }, { userId: otherUserId }],
          },
        },
      }));
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

  async send(userId: string, conversationId: string, content: string) {
    await this.assertParticipant(userId, conversationId);
    const message = await this.prisma.message.create({
      data: { conversationId, authorId: userId, content: content.trim() },
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
