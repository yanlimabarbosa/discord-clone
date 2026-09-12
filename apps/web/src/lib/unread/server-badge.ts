import type { ServerUnread } from '../../types/unread';

export type ServerBadge = {
  hasUnread: boolean;
  mentions: number;
};

export function serverBadge(unread: ServerUnread | undefined): ServerBadge {
  if (!unread) return { hasUnread: false, mentions: 0 };
  const channels = Object.values(unread);
  return {
    hasUnread: channels.some((c) => c.unread),
    mentions: channels.reduce((sum, c) => sum + c.mentions, 0),
  };
}
