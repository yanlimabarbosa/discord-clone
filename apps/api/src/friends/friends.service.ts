import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const PUBLIC_USER = {
  id: true,
  displayName: true,
  avatarUrl: true,
  isGuest: true,
  username: true,
} as const;

@Injectable()
export class FriendsService {
  constructor(private readonly prisma: PrismaService) {}

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
    return this.prisma.friendship.create({
      data: { requesterId: userId, addresseeId: target.id },
    });
  }

  async accept(userId: string, friendshipId: string) {
    const fr = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
    });
    if (!fr || fr.addresseeId !== userId) {
      throw new NotFoundException('request not found');
    }
    return this.prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: 'ACCEPTED' },
    });
  }

  async remove(userId: string, friendshipId: string) {
    const fr = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
    });
    if (!fr || (fr.requesterId !== userId && fr.addresseeId !== userId)) {
      throw new NotFoundException('not found');
    }
    await this.prisma.friendship.delete({ where: { id: friendshipId } });
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
