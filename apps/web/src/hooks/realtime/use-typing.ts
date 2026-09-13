import { useEffect, useRef, useState } from 'react';
import { getSocket } from '../../lib/socket';

type TypingEvent = {
  channelId: string;
  userId: string;
  displayName: string;
  isTyping: boolean;
};

const TYPING_TIMEOUT = 4000;

export function useTyping(channelId: string | null): string[] {
  const [names, setNames] = useState<string[]>([]);
  const entriesRef = useRef<Map<string, { name: string; expires: number }>>(
    new Map(),
  );

  useEffect(() => {
    entriesRef.current.clear();
    setNames([]);
    if (!channelId) return;

    const socket = getSocket();
    const entries = entriesRef.current;
    let interval: number | null = null;
    let lastKey = '';

    // The expiry interval only runs while someone is typing, and setNames is
    // skipped when the derived list is unchanged, so idle channels never
    // re-render.
    const sync = () => {
      const now = Date.now();
      for (const [userId, entry] of entries) {
        if (entry.expires <= now) entries.delete(userId);
      }
      if (entries.size === 0 && interval !== null) {
        window.clearInterval(interval);
        interval = null;
      } else if (entries.size > 0 && interval === null) {
        interval = window.setInterval(sync, 1000);
      }
      const next = Array.from(entries.values()).map((e) => e.name);
      const nextKey = next.join('|');
      if (nextKey === lastKey) return;
      lastKey = nextKey;
      setNames(next);
    };

    const onTyping = (event: TypingEvent) => {
      if (event.channelId !== channelId) return;
      if (event.isTyping) {
        entries.set(event.userId, {
          name: event.displayName,
          expires: Date.now() + TYPING_TIMEOUT,
        });
      } else {
        entries.delete(event.userId);
      }
      sync();
    };

    socket.on('typing', onTyping);

    return () => {
      socket.off('typing', onTyping);
      if (interval !== null) window.clearInterval(interval);
      entries.clear();
    };
  }, [channelId]);

  return names;
}
