import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ServersService } from '../servers/servers.service';
import { ChatGateway } from '../gateway/chat.gateway';

@Injectable()
export class MembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly servers: ServersService,
    private readonly gateway: ChatGateway,
  ) {}

  async list(userId: string, serverId: string) {
    await this.servers.assertMember(userId, serverId);
    const members = await this.prisma.serverMember.findMany({
      where: { serverId },
      include: {
        user: {
          select: { id: true, displayName: true, avatarUrl: true, isGuest: true },
        },
      },
    });
    return members.map((m) => {
      const presence = this.gateway.getPresence(m.user.id);
      return {
        id: m.user.id,
        displayName: m.user.displayName,
        avatarUrl: m.user.avatarUrl,
        isGuest: m.user.isGuest,
        online: presence.online,
        voiceChannelId: presence.voiceChannelId,
      };
    });
  }
}
