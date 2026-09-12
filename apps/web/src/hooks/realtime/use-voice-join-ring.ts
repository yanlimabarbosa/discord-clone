import { useEffect, useRef } from 'react';
import { getSocket } from '../../lib/socket';
import { playJoinSound } from '../../lib/sounds';

type PresenceEvent = {
  userId: string;
  online: boolean;
  voiceChannelId: string | null;
};

export function useVoiceJoinRing(
  meId: string | undefined,
  myVoiceChannelId: string | null,
) {
  const prev = useRef<Record<string, string | null>>({});

  useEffect(() => {
    const socket = getSocket();
    const onPresence = (e: PresenceEvent) => {
      const before = prev.current[e.userId] ?? null;
      prev.current[e.userId] = e.voiceChannelId;
      if (e.userId === meId) return;
      const joinedVoice = before === null && !!e.voiceChannelId;
      const differentChannel = e.voiceChannelId !== myVoiceChannelId;
      if (joinedVoice && differentChannel) playJoinSound();
    };
    socket.on('presence', onPresence);
    return () => {
      socket.off('presence', onPresence);
    };
  }, [meId, myVoiceChannelId]);
}
