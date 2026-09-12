import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '../../lib/socket';
import type { DeafenMap } from './use-deafen-state';

type DeafenEvent = { userId: string; deafened: boolean };

export function useDeafenRealtime() {
  const qc = useQueryClient();

  useEffect(() => {
    const socket = getSocket();
    const onDeafen = (e: DeafenEvent) => {
      qc.setQueryData<DeafenMap>(['deafen'], (old = {}) => ({
        ...old,
        [e.userId]: e.deafened,
      }));
    };
    socket.on('voice.deafen', onDeafen);
    return () => {
      socket.off('voice.deafen', onDeafen);
    };
  }, [qc]);
}
