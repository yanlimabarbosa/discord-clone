import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ServersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, name: string) {
    return this.prisma.server.create({
      data: {
        name: name.trim(),
        ownerId: userId,
        channels: {
          create: [
            { name: 'general', type: 'TEXT', position: 0 },
            { name: 'General', type: 'VOICE', position: 1 },
          ],
        },
        members: { create: [{ userId }] },
      },
      include: { channels: { orderBy: { position: 'asc' } } },
    });
  }

  async listForUser(userId: string) {
    return this.prisma.server.findMany({
      where: { members: { some: { userId } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getWithChannels(userId: string, serverId: string) {
    await this.assertMember(userId, serverId);
    return this.prisma.server.findUnique({
      where: { id: serverId },
      include: { channels: { orderBy: { position: 'asc' } } },
    });
  }

  async assertMember(userId: string, serverId: string) {
    const member = await this.prisma.serverMember.findUnique({
      where: { serverId_userId: { serverId, userId } },
    });
    if (!member) throw new ForbiddenException('not a member of this server');
  }
}
