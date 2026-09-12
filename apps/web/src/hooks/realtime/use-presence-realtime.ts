import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '../../lib/socket';
import type { Member } from '../../types/member';

type PresenceEvent = {
  userId: string;
  online: boolean;
  voiceChannelId: string | null;
};

export function usePresenceRealtime() {
  const qc = useQueryClient();

  useEffect(() => {
    const socket = getSocket();
    const onPresence = (e: PresenceEvent) => {
      let matched = false;
      qc.setQueriesData<Member[]>({ queryKey: ['members'] }, (old) =>
        old?.map((m) => {
          if (m.id === e.userId) {
            matched = true;
            return { ...m, online: e.online, voiceChannelId: e.voiceChannelId };
          }
          return m;
        }),
      );
      // A member we don't have cached just entered voice → refetch so they
      // appear under the channel immediately.
      if (!matched && e.voiceChannelId) {
        qc.invalidateQueries({ queryKey: ['members'] });
      }
    };
    socket.on('presence', onPresence);
    return () => {
      socket.off('presence', onPresence);
    };
  }, [qc]);
}
