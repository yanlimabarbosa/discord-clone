export type ChannelType = 'TEXT' | 'VOICE';

export type Channel = {
  id: string;
  serverId: string;
  name: string;
  icon: string | null;
  type: ChannelType;
  position: number;
};

export type Server = {
  id: string;
  name: string;
  iconUrl: string | null;
  ownerId: string;
};
