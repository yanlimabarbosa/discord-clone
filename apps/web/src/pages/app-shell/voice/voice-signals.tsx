import { useEffect } from 'react';
import { getSocket } from '../../../lib/socket';

type VoiceSignalsProps = {
  channelId: string;
};

export function VoiceSignals({ channelId }: VoiceSignalsProps) {
  useEffect(() => {
    const socket = getSocket();
    const announce = () => socket.emit('voice.join', { channelId });
    announce();
    // Re-announce after a reconnect (e.g. server restart wiped presence).
    socket.on('connect', announce);
    return () => {
      socket.off('connect', announce);
      socket.emit('voice.leave', {});
    };
  }, [channelId]);

  return null;
}
