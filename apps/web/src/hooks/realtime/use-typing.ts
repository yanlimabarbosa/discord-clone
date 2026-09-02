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

    const sync = () => {
      const now = Date.now();
      for (const [userId, entry] of entries) {
        if (entry.expires <= now) entries.delete(userId);
      }
      setNames(Array.from(entries.values()).map((e) => e.name));
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
    const interval = window.setInterval(sync, 1000);

    return () => {
      socket.off('typing', onTyping);
      window.clearInterval(interval);
      entries.clear();
    };
  }, [channelId]);

  return names;
}
