export type Role = {
  id: string;
  serverId: string;
  name: string;
  color: string;
  position: number;
  permissions: number;
  assignments: { userId: string }[];
};

export type MyPermissions = {
  permissions: number;
  isOwner: boolean;
};
