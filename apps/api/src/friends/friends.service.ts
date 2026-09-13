import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ChatGateway } from '../gateway/chat.gateway';

const PUBLIC_USER = {
  id: true,
  displayName: true,
  avatarUrl: true,
  isGuest: true,
  username: true,
} as const;

function publicUser(u: User) {
  return {
    id: u.id,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    isGuest: u.isGuest,
    username: u.username,
  };
}

@Injectable()
export class FriendsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: ChatGateway,
  ) {}

  async sendRequest(userId: string, username: string) {
    const target = await this.prisma.user.findUnique({
      where: { username: username.trim().toLowerCase() },
    });
    if (!target) throw new NotFoundException('user not found');
    if (target.id === userId) {
      throw new BadRequestException("you can't add yourself");
    }
    const existing = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId, addresseeId: target.id },
          { requesterId: target.id, addresseeId: userId },
        ],
      },
    });
    if (existing) throw new BadRequestException('already requested or friends');
    const fr = await this.prisma.friendship.create({
      data: { requesterId: userId, addresseeId: target.id },
    });
    const requester = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: PUBLIC_USER,
    });
    this.gateway.emitFriendUpdate([userId, target.id], {
      kind: 'request',
      friendshipId: fr.id,
      requester,
      addressee: publicUser(target),
    });
    return fr;
  }

  async accept(userId: string, friendshipId: string) {
    const fr = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
    });
    if (!fr || fr.addresseeId !== userId) {
      throw new NotFoundException('request not found');
    }
    const updated = await this.prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: 'ACCEPTED' },
      include: {
        requester: { select: PUBLIC_USER },
        addressee: { select: PUBLIC_USER },
      },
    });
    this.gateway.emitFriendUpdate([updated.requesterId, updated.addresseeId], {
      kind: 'accepted',
      friendshipId: updated.id,
      requester: updated.requester,
      addressee: updated.addressee,
    });
    return updated;
  }

  async remove(userId: string, friendshipId: string) {
    const fr = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
      include: {
        requester: { select: PUBLIC_USER },
        addressee: { select: PUBLIC_USER },
      },
    });
    if (!fr || (fr.requesterId !== userId && fr.addresseeId !== userId)) {
      throw new NotFoundException('not found');
    }
    await this.prisma.friendship.delete({ where: { id: friendshipId } });
    this.gateway.emitFriendUpdate([fr.requesterId, fr.addresseeId], {
      kind: 'removed',
      friendshipId: fr.id,
      requester: fr.requester,
      addressee: fr.addressee,
    });
    return { ok: true };
  }

  async list(userId: string) {
    const rows = await this.prisma.friendship.findMany({
      where: { OR: [{ requesterId: userId }, { addresseeId: userId }] },
      include: {
        requester: { select: PUBLIC_USER },
        addressee: { select: PUBLIC_USER },
      },
    });
    const friends = rows
      .filter((r) => r.status === 'ACCEPTED')
      .map((r) => ({
        friendshipId: r.id,
        user: r.requesterId === userId ? r.addressee : r.requester,
      }));
    const incoming = rows
      .filter((r) => r.status === 'PENDING' && r.addresseeId === userId)
      .map((r) => ({ friendshipId: r.id, user: r.requester }));
    const outgoing = rows
      .filter((r) => r.status === 'PENDING' && r.requesterId === userId)
      .map((r) => ({ friendshipId: r.id, user: r.addressee }));
    return { friends, incoming, outgoing };
  }
}
