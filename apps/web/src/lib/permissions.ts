export const Permissions = {
  MANAGE_SERVER: 1 << 0,
  MANAGE_CHANNELS: 1 << 1,
  MANAGE_ROLES: 1 << 2,
  KICK_MEMBERS: 1 << 3,
  BAN_MEMBERS: 1 << 4,
  MOVE_MEMBERS: 1 << 5,
  MUTE_MEMBERS: 1 << 6,
  DEAFEN_MEMBERS: 1 << 7,
} as const;

export type PermissionKey = keyof typeof Permissions;

export type PermissionInfo = {
  key: PermissionKey;
  bit: number;
  label: string;
  description: string;
};

export const PERMISSION_LIST: PermissionInfo[] = [
  {
    key: 'MANAGE_SERVER',
    bit: Permissions.MANAGE_SERVER,
    label: 'Manage Server',
    description: 'Change the name, icon, and privacy of the server.',
  },
  {
    key: 'MANAGE_CHANNELS',
    bit: Permissions.MANAGE_CHANNELS,
    label: 'Manage Channels',
    description: 'Create, edit, delete, and reorder channels and categories.',
  },
  {
    key: 'MANAGE_ROLES',
    bit: Permissions.MANAGE_ROLES,
    label: 'Manage Roles',
    description: 'Create roles and assign them to members.',
  },
  {
    key: 'KICK_MEMBERS',
    bit: Permissions.KICK_MEMBERS,
    label: 'Kick Members',
    description: 'Remove members from the server.',
  },
  {
    key: 'BAN_MEMBERS',
    bit: Permissions.BAN_MEMBERS,
    label: 'Ban Members',
    description: 'Permanently ban members from the server.',
  },
  {
    key: 'MOVE_MEMBERS',
    bit: Permissions.MOVE_MEMBERS,
    label: 'Move Members',
    description: 'Drag members between voice channels.',
  },
  {
    key: 'MUTE_MEMBERS',
    bit: Permissions.MUTE_MEMBERS,
    label: 'Mute Members',
    description: 'Server-mute other members in voice.',
  },
  {
    key: 'DEAFEN_MEMBERS',
    bit: Permissions.DEAFEN_MEMBERS,
    label: 'Deafen Members',
    description: 'Server-deafen other members in voice.',
  },
];

export function hasPermission(bitfield: number, perm: number): boolean {
  return (bitfield & perm) === perm;
}
