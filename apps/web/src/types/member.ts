export type Member = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  isGuest: boolean;
  online: boolean;
  voiceChannelId: string | null;
};
