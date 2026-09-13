const STORAGE_KEY = 'nyx.dmLastSeen';

// Conversation id -> the lastMessage snapshot the user has already seen.
// DM summaries carry no message timestamps, so unread is detected by the
// lastMessage text changing since the conversation was last open.
export type DmSeenMap = Record<string, string>;

function load(): DmSeenMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DmSeenMap) : {};
  } catch {
    return {};
  }
}

let current = load();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // ignore storage failures (private mode, quota)
  }
}

export const dmReadStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return current;
  },
  markSeen(conversationId: string, lastMessage: string | null) {
    const value = lastMessage ?? '';
    if (current[conversationId] === value) return;
    current = { ...current, [conversationId]: value };
    persist();
    for (const listener of listeners) listener();
  },
  isUnread(conversationId: string, lastMessage: string | null) {
    if (lastMessage == null) return false;
    const seen = current[conversationId];
    return seen !== undefined && seen !== lastMessage;
  },
};
