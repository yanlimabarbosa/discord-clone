import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ServersService } from '../servers/servers.service';

@Injectable()
export class InvitesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly servers: ServersService,
  ) {}

  async create(
    userId: string,
    serverId: string,
    opts: { maxUses?: number; expiresInHours?: number },
  ) {
    await this.servers.assertMember(userId, serverId);
    const code = randomBytes(6).toString('base64url').slice(0, 8);
    const expiresAt = opts.expiresInHours
      ? new Date(Date.now() + opts.expiresInHours * 3600 * 1000)
      : null;
    return this.prisma.invite.create({
      data: {
        code,
        serverId,
        createdById: userId,
        maxUses: opts.maxUses ?? null,
        expiresAt,
      },
    });
  }

  async preview(code: string) {
    const invite = await this.findValid(code);
    return {
      code: invite.code,
      server: { id: invite.server.id, name: invite.server.name },
    };
  }

  async join(userId: string, code: string) {
    const invite = await this.findValid(code);
    const existing = await this.prisma.serverMember.findUnique({
      where: { serverId_userId: { serverId: invite.serverId, userId } },
    });
    if (!existing) {
      await this.prisma.$transaction([
        this.prisma.serverMember.create({
          data: { serverId: invite.serverId, userId },
        }),
        this.prisma.invite.update({
          where: { id: invite.id },
          data: { uses: { increment: 1 } },
        }),
      ]);
    }
    return invite.server;
  }

  private async findValid(code: string) {
    const invite = await this.prisma.invite.findUnique({
      where: { code },
      include: { server: true },
    });
    if (!invite) throw new NotFoundException('invite not found');
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      throw new BadRequestException('invite expired');
    }
    if (invite.maxUses != null && invite.uses >= invite.maxUses) {
      throw new BadRequestException('invite has been used up');
    }
    return invite;
  }
}
