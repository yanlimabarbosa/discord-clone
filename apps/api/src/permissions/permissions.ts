// Discord-style permission bitfield. Owner bypasses all checks.
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

export const ALL_PERMISSIONS = Object.values(Permissions).reduce(
  (acc, bit) => acc | bit,
  0,
);

export function hasPermission(bitfield: number, perm: number): boolean {
  return (bitfield & perm) === perm;
}
