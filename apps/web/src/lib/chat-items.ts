import { dayKey, formatDayDivider } from './message-time';

export type GroupableMessage = {
  id: string;
  createdAt: string;
  author: { id: string };
  replyTo?: unknown;
};

export type ChatItem<M extends GroupableMessage> = {
  message: M;
  compact: boolean;
  dayLabel: string | null;
};

const GROUP_WINDOW_MS = 7 * 60 * 1000;

export function buildChatItems<M extends GroupableMessage>(
  messages: M[],
): ChatItem<M>[] {
  const items: ChatItem<M>[] = [];
  let prev: M | null = null;
  for (const message of messages) {
    const newDay = !prev || dayKey(prev.createdAt) !== dayKey(message.createdAt);
    const compact =
      !newDay &&
      !!prev &&
      prev.author.id === message.author.id &&
      !message.replyTo &&
      new Date(message.createdAt).getTime() -
        new Date(prev.createdAt).getTime() <
        GROUP_WINDOW_MS;
    items.push({
      message,
      compact,
      dayLabel: newDay ? formatDayDivider(message.createdAt) : null,
    });
    prev = message;
  }
  return items;
}
