import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '../../lib/socket';
import { notify, requestNotificationPermission } from '../../lib/notifications';
import type { DmSummary } from '../../types/dm';

type DmActivityEvent = {
  conversationId: string;
  lastMessage: string;
  from: { id: string; displayName: string; avatarUrl: string | null };
};

// App-wide DM feed. The server sends dm.activity to recipients only (never the
// author), for every DM regardless of which conversation is open. It ONLY
// touches the ['dms'] summaries — messages of the open conversation arrive via
// dm.new and are handled by useDmRealtime, so the two handlers never write the
// same cache. The lastMessage bump is what flips dm-read-store's unread dot.
export function useDmActivity() {
  const qc = useQueryClient();

  useEffect(() => {
    const socket = getSocket();
    const onActivity = (e: DmActivityEvent) => {
      const dms = qc.getQueryData<DmSummary[]>(['dms']);
      const summary = dms?.find((d) => d.id === e.conversationId);
      if (summary) {
        qc.setQueryData<DmSummary[]>(['dms'], (old = []) => [
          { ...summary, lastMessage: e.lastMessage },
          ...old.filter((d) => d.id !== e.conversationId),
        ]);
      } else {
        // Conversation not cached yet — refetch to pick it up.
        qc.invalidateQueries({ queryKey: ['dms'] });
      }
      requestNotificationPermission();
      notify(`New message from ${e.from.displayName}`, e.lastMessage || undefined);
    };
    socket.on('dm.activity', onActivity);
    return () => {
      socket.off('dm.activity', onActivity);
    };
  }, [qc]);
}
