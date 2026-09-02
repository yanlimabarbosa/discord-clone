import { useEffect } from 'react';
import { getSocket } from '../../../lib/socket';

type VoiceSignalsProps = {
  channelId: string;
};

export function VoiceSignals({ channelId }: VoiceSignalsProps) {
  useEffect(() => {
    const socket = getSocket();
    socket.emit('voice.join', { channelId });
    return () => {
      socket.emit('voice.leave', {});
    };
  }, [channelId]);

  return null;
}
