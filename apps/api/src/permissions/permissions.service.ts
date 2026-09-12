import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ALL_PERMISSIONS, hasPermission } from './permissions';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async compute(userId: string, serverId: string): Promise<number> {
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
      select: { ownerId: true },
    });
    if (!server) throw new NotFoundException('server not found');
    if (server.ownerId === userId) return ALL_PERMISSIONS;
    const assignments = await this.prisma.roleAssignment.findMany({
      where: { userId, role: { serverId } },
      select: { role: { select: { permissions: true } } },
    });
    return assignments.reduce((acc, a) => acc | a.role.permissions, 0);
  }

  async isOwner(userId: string, serverId: string): Promise<boolean> {
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
      select: { ownerId: true },
    });
    return !!server && server.ownerId === userId;
  }

  async has(userId: string, serverId: string, perm: number): Promise<boolean> {
    return hasPermission(await this.compute(userId, serverId), perm);
  }

  async assert(userId: string, serverId: string, perm: number): Promise<void> {
    if (!(await this.has(userId, serverId, perm))) {
      throw new ForbiddenException('missing permission');
    }
  }
}
