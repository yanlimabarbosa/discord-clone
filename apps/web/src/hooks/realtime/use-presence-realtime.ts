import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '../../lib/socket';
import type { Member } from '../../types/member';

type PresenceEvent = {
  userId: string;
  online: boolean;
  voiceChannelId: string | null;
};

// The gateway's presence event carries no serverId, so an unknown user
// entering voice can't be scoped to one server; coalesce the refetch instead
// and only hit the mounted members query.
const UNKNOWN_MEMBER_REFETCH_DELAY = 500;

export function usePresenceRealtime() {
  const qc = useQueryClient();
  const refetchTimer = useRef<number | null>(null);

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
      if (!matched && e.voiceChannelId && refetchTimer.current === null) {
        refetchTimer.current = window.setTimeout(() => {
          refetchTimer.current = null;
          qc.invalidateQueries({ queryKey: ['members'], refetchType: 'active' });
        }, UNKNOWN_MEMBER_REFETCH_DELAY);
      }
    };
    socket.on('presence', onPresence);
    return () => {
      socket.off('presence', onPresence);
      if (refetchTimer.current !== null) {
        window.clearTimeout(refetchTimer.current);
        refetchTimer.current = null;
      }
    };
  }, [qc]);
}
