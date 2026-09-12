import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsService } from '../permissions/permissions.service';
import { ChatGateway } from '../gateway/chat.gateway';
import { Permissions } from '../permissions/permissions';

@Injectable()
export class VoiceModerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: PermissionsService,
    private readonly gateway: ChatGateway,
  ) {}

  async move(
    userId: string,
    serverId: string,
    targetUserId: string,
    channelId: string,
  ) {
    await this.permissions.assert(userId, serverId, Permissions.MOVE_MEMBERS);
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      select: { serverId: true, type: true, name: true, server: { select: { name: true } } },
    });
    if (!channel || channel.serverId !== serverId) {
      throw new NotFoundException('channel not found in this server');
    }
    if (channel.type !== 'VOICE') {
      throw new BadRequestException('target must be a voice channel');
    }
    this.gateway.emitVoiceMoved({
      userId: targetUserId,
      channelId,
      serverId,
      channelName: channel.name,
      serverName: channel.server.name,
    });
    return { ok: true };
  }

  async setMute(
    userId: string,
    serverId: string,
    targetUserId: string,
    muted: boolean,
  ) {
    await this.permissions.assert(userId, serverId, Permissions.MUTE_MEMBERS);
    this.gateway.emitForceMute(targetUserId, muted);
    return { ok: true };
  }

  async setDeafen(
    userId: string,
    serverId: string,
    targetUserId: string,
    deafened: boolean,
  ) {
    await this.permissions.assert(userId, serverId, Permissions.DEAFEN_MEMBERS);
    this.gateway.emitForceDeafen(targetUserId, deafened);
    return { ok: true };
  }
}
