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
      qc.setQueriesData<Member[]>({ queryKey: ['members'] }, (old) =>
        old?.map((m) =>
          m.id === e.userId
            ? { ...m, online: e.online, voiceChannelId: e.voiceChannelId }
            : m,
        ),
      );
    };
    socket.on('presence', onPresence);
    return () => {
      socket.off('presence', onPresence);
    };
  }, [qc]);
}
