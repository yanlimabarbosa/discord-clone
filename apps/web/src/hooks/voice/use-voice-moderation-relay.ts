import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '../../lib/socket';
import type { VoiceForce } from './use-voice-force';

export type VoiceMovedEvent = {
  userId: string;
  channelId: string;
  serverId: string;
  channelName: string;
  serverName: string;
};

export function useVoiceModerationRelay(
  meId: string | undefined,
  onMoved: (e: VoiceMovedEvent) => void,
) {
  const qc = useQueryClient();

  useEffect(() => {
    const socket = getSocket();

    const onForceMute = (e: { userId: string; muted: boolean }) => {
      if (e.userId !== meId) return;
      qc.setQueryData<VoiceForce>(['voiceForce'], (old) => ({
        muted: e.muted,
        deafened: old?.deafened ?? false,
      }));
    };
    const onForceDeafen = (e: { userId: string; deafened: boolean }) => {
      if (e.userId !== meId) return;
      qc.setQueryData<VoiceForce>(['voiceForce'], (old) => ({
        muted: old?.muted ?? false,
        deafened: e.deafened,
      }));
    };
    const onMovedEvt = (e: VoiceMovedEvent) => {
      if (e.userId !== meId) return;
      onMoved(e);
    };

    socket.on('voice.forceMute', onForceMute);
    socket.on('voice.forceDeafen', onForceDeafen);
    socket.on('voice.moved', onMovedEvt);
    return () => {
      socket.off('voice.forceMute', onForceMute);
      socket.off('voice.forceDeafen', onForceDeafen);
      socket.off('voice.moved', onMovedEvt);
    };
  }, [qc, meId, onMoved]);
}
