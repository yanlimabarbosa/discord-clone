import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { mkdirSync, writeFileSync } from 'fs';
import { join, extname } from 'path';
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

  async listPublic(userId: string) {
    const servers = await this.prisma.server.findMany({
      where: { isPublic: true, members: { none: { userId } } },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { members: true } } },
    });
    return servers.map((s) => ({
      id: s.id,
      name: s.name,
      iconUrl: s.iconUrl,
      ownerId: s.ownerId,
      isPublic: s.isPublic,
      memberCount: s._count.members,
    }));
  }

  async getWithChannels(userId: string, serverId: string) {
    await this.assertCanView(userId, serverId);
    return this.prisma.server.findUnique({
      where: { id: serverId },
      include: { channels: { orderBy: { position: 'asc' } } },
    });
  }

  async join(userId: string, serverId: string) {
    const server = await this.getServer(serverId);
    await this.assertNotBanned(userId, serverId);
    if (!server.isPublic) {
      throw new ForbiddenException('this server is invite-only');
    }
    await this.ensureMember(userId, serverId);
    return server;
  }

  async rename(userId: string, serverId: string, name: string) {
    await this.assertOwner(userId, serverId);
    return this.prisma.server.update({
      where: { id: serverId },
      data: { name: name.trim() },
    });
  }

  async setIconUrl(userId: string, serverId: string, iconUrl: string) {
    await this.assertOwner(userId, serverId);
    return this.prisma.server.update({
      where: { id: serverId },
      data: { iconUrl },
    });
  }

  async setIconFromFile(
    userId: string,
    serverId: string,
    file: { originalname: string; buffer: Buffer },
  ) {
    await this.assertOwner(userId, serverId);
    const dir = join(process.cwd(), 'uploads');
    mkdirSync(dir, { recursive: true });
    const ext = extname(file.originalname) || '.png';
    const filename = `server-${serverId}-${Date.now()}${ext}`;
    writeFileSync(join(dir, filename), file.buffer);
    return this.prisma.server.update({
      where: { id: serverId },
      data: { iconUrl: `/api/uploads/${filename}` },
    });
  }

  async remove(userId: string, serverId: string) {
    await this.assertOwner(userId, serverId);
    await this.prisma.server.delete({ where: { id: serverId } });
    return { ok: true };
  }

  async leave(userId: string, serverId: string) {
    const server = await this.getServer(serverId);
    if (server.ownerId === userId) {
      throw new ForbiddenException('owner must delete or transfer the server');
    }
    await this.prisma.serverMember.deleteMany({ where: { serverId, userId } });
    return { ok: true };
  }

  async kick(userId: string, serverId: string, targetId: string) {
    await this.assertOwner(userId, serverId);
    if (targetId === userId) throw new BadRequestException("can't kick yourself");
    await this.prisma.serverMember.deleteMany({
      where: { serverId, userId: targetId },
    });
    return { ok: true };
  }

  async ban(userId: string, serverId: string, targetId: string) {
    await this.assertOwner(userId, serverId);
    if (targetId === userId) throw new BadRequestException("can't ban yourself");
    await this.prisma.$transaction([
      this.prisma.serverMember.deleteMany({
        where: { serverId, userId: targetId },
      }),
      this.prisma.serverBan.upsert({
        where: { serverId_userId: { serverId, userId: targetId } },
        create: { serverId, userId: targetId },
        update: {},
      }),
    ]);
    return { ok: true };
  }

  async assertOwner(userId: string, serverId: string) {
    const server = await this.getServer(serverId);
    if (server.ownerId !== userId) {
      throw new ForbiddenException('owner only');
    }
  }

  async assertNotBanned(userId: string, serverId: string) {
    const ban = await this.prisma.serverBan.findUnique({
      where: { serverId_userId: { serverId, userId } },
    });
    if (ban) throw new ForbiddenException('you are banned from this server');
  }

  async setPrivacy(userId: string, serverId: string, isPublic: boolean) {
    const server = await this.getServer(serverId);
    if (server.ownerId !== userId) {
      throw new ForbiddenException('only the owner can change privacy');
    }
    return this.prisma.server.update({
      where: { id: serverId },
      data: { isPublic },
    });
  }

  async ensureMember(userId: string, serverId: string) {
    const existing = await this.prisma.serverMember.findUnique({
      where: { serverId_userId: { serverId, userId } },
    });
    if (!existing) {
      await this.assertNotBanned(userId, serverId);
      await this.prisma.serverMember.create({ data: { serverId, userId } });
    }
  }

  async isMember(userId: string, serverId: string): Promise<boolean> {
    const m = await this.prisma.serverMember.findUnique({
      where: { serverId_userId: { serverId, userId } },
    });
    return !!m;
  }

  async assertMember(userId: string, serverId: string) {
    if (!(await this.isMember(userId, serverId))) {
      throw new ForbiddenException('not a member of this server');
    }
  }

  // A public server is viewable by anyone; a private one only by members.
  async assertCanView(userId: string, serverId: string) {
    if (await this.isMember(userId, serverId)) return;
    const server = await this.getServer(serverId);
    if (!server.isPublic) {
      throw new ForbiddenException('this server is private');
    }
  }

  private async getServer(serverId: string) {
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
    });
    if (!server) throw new NotFoundException('server not found');
    return server;
  }
}
