import type { UnreadMap } from '../../types/unread';

export type ActivityEvent = {
  channelId: string;
  serverId: string;
  authorId: string;
  mentionsEveryone: boolean;
  mentionedUserIds: string[];
};

export function isMention(
  e: ActivityEvent,
  meId: string | undefined,
): boolean {
  return e.mentionsEveryone || (!!meId && e.mentionedUserIds.includes(meId));
}

export function applyActivity(
  map: UnreadMap,
  e: ActivityEvent,
  meId: string | undefined,
  activeChannelId: string | null,
): UnreadMap {
  if (e.authorId === meId) return map;
  if (e.channelId === activeChannelId) return map;
  const server = { ...(map[e.serverId] ?? {}) };
  const cur = server[e.channelId] ?? { unread: false, mentions: 0 };
  server[e.channelId] = {
    unread: true,
    mentions: cur.mentions + (isMention(e, meId) ? 1 : 0),
  };
  return { ...map, [e.serverId]: server };
}
