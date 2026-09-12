import { useEffect, useRef } from 'react';
import { useLocalParticipant } from '@livekit/components-react';
import { getSocket } from '../../../lib/socket';

// Broadcasts the local user's mic-mute state so other clients can show a
// muted icon in the sidebar / member list (not just inside the LiveKit room).
export function LocalMuteRelay() {
  const { isMicrophoneEnabled } = useLocalParticipant();
  const muted = !isMicrophoneEnabled;
  const last = useRef<boolean | null>(null);

  useEffect(() => {
    if (last.current === muted) return;
    last.current = muted;
    getSocket().emit('voice.mute', { muted });
  }, [muted]);

  useEffect(() => {
    return () => {
      getSocket().emit('voice.mute', { muted: false });
    };
  }, []);

  return null;
}
