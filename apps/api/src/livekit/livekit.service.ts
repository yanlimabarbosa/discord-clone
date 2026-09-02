import { Injectable, NotFoundException } from '@nestjs/common';
import { AccessToken } from 'livekit-server-sdk';
import { PrismaService } from '../prisma/prisma.service';
import { ServersService } from '../servers/servers.service';

@Injectable()
export class LivekitService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly servers: ServersService,
  ) {}

  async createChannelToken(
    userId: string,
    channelId: string,
    displayName: string,
  ): Promise<string> {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      select: { serverId: true },
    });
    if (!channel) throw new NotFoundException('channel not found');
    await this.servers.assertMember(userId, channel.serverId);

    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      { identity: userId, name: displayName },
    );
    at.addGrant({
      roomJoin: true,
      room: channelId,
      canPublish: true,
      canSubscribe: true,
    });
    return at.toJwt();
  }
}
