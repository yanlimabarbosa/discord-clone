import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '../../lib/socket';
import type { MuteMap } from './use-mute-state';

type MuteEvent = { userId: string; muted: boolean };

export function useMuteRealtime() {
  const qc = useQueryClient();

  useEffect(() => {
    const socket = getSocket();
    const onMute = (e: MuteEvent) => {
      qc.setQueryData<MuteMap>(['mute'], (old = {}) => ({
        ...old,
        [e.userId]: e.muted,
      }));
    };
    socket.on('voice.mute', onMute);
    return () => {
      socket.off('voice.mute', onMute);
    };
  }, [qc]);
}
