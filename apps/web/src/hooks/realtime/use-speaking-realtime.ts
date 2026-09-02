import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '../../lib/socket';
import type { SpeakingMap } from './use-speaking';

type SpeakingEvent = { userId: string; speaking: boolean };

export function useSpeakingRealtime() {
  const qc = useQueryClient();

  useEffect(() => {
    const socket = getSocket();
    const onSpeaking = (e: SpeakingEvent) => {
      qc.setQueryData<SpeakingMap>(['speaking'], (old = {}) => ({
        ...old,
        [e.userId]: e.speaking,
      }));
    };
    socket.on('voice.speaking', onSpeaking);
    return () => {
      socket.off('voice.speaking', onSpeaking);
    };
  }, [qc]);
}
