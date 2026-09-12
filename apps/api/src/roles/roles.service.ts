import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ServersService } from '../servers/servers.service';
import { PermissionsService } from '../permissions/permissions.service';
import { ALL_PERMISSIONS, Permissions } from '../permissions/permissions';

type RolePatch = { name?: string; color?: string; permissions?: number };

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly servers: ServersService,
    private readonly permissions: PermissionsService,
  ) {}

  async list(userId: string, serverId: string) {
    await this.servers.assertCanView(userId, serverId);
    return this.prisma.role.findMany({
      where: { serverId },
      orderBy: { position: 'asc' },
      include: {
        assignments: { select: { userId: true } },
      },
    });
  }

  async myPermissions(userId: string, serverId: string) {
    await this.servers.assertCanView(userId, serverId);
    const [permissions, isOwner] = await Promise.all([
      this.permissions.compute(userId, serverId),
      this.permissions.isOwner(userId, serverId),
    ]);
    return { permissions, isOwner };
  }

  async create(userId: string, serverId: string, patch: RolePatch) {
    await this.permissions.assert(userId, serverId, Permissions.MANAGE_ROLES);
    const count = await this.prisma.role.count({ where: { serverId } });
    return this.prisma.role.create({
      data: {
        serverId,
        name: patch.name?.trim() || 'new role',
        color: normalizeColor(patch.color),
        permissions: maskPermissions(patch.permissions ?? 0),
        position: count,
      },
    });
  }

  async update(userId: string, roleId: string, patch: RolePatch) {
    const role = await this.getRole(roleId);
    await this.permissions.assert(
      userId,
      role.serverId,
      Permissions.MANAGE_ROLES,
    );
    return this.prisma.role.update({
      where: { id: roleId },
      data: {
        ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
        ...(patch.color !== undefined
          ? { color: normalizeColor(patch.color) }
          : {}),
        ...(patch.permissions !== undefined
          ? { permissions: maskPermissions(patch.permissions) }
          : {}),
      },
    });
  }

  async remove(userId: string, roleId: string) {
    const role = await this.getRole(roleId);
    await this.permissions.assert(
      userId,
      role.serverId,
      Permissions.MANAGE_ROLES,
    );
    await this.prisma.role.delete({ where: { id: roleId } });
    return { ok: true };
  }

  async assign(userId: string, roleId: string, targetUserId: string) {
    const role = await this.getRole(roleId);
    await this.permissions.assert(
      userId,
      role.serverId,
      Permissions.MANAGE_ROLES,
    );
    const isMember = await this.prisma.serverMember.findUnique({
      where: {
        serverId_userId: { serverId: role.serverId, userId: targetUserId },
      },
    });
    if (!isMember) throw new BadRequestException('user is not a member');
    await this.prisma.roleAssignment.upsert({
      where: { roleId_userId: { roleId, userId: targetUserId } },
      create: { roleId, userId: targetUserId },
      update: {},
    });
    return { ok: true };
  }

  async unassign(userId: string, roleId: string, targetUserId: string) {
    const role = await this.getRole(roleId);
    await this.permissions.assert(
      userId,
      role.serverId,
      Permissions.MANAGE_ROLES,
    );
    await this.prisma.roleAssignment.deleteMany({
      where: { roleId, userId: targetUserId },
    });
    return { ok: true };
  }

  private async getRole(roleId: string) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('role not found');
    return role;
  }
}

function maskPermissions(value: number): number {
  return (Number(value) || 0) & ALL_PERMISSIONS;
}

function normalizeColor(color?: string): string {
  if (color && /^#[0-9a-fA-F]{6}$/.test(color)) return color;
  return '#99aab5';
}
