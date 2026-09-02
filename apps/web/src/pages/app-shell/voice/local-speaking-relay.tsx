import { useEffect, useRef } from 'react';
import { useLocalParticipant, useIsSpeaking } from '@livekit/components-react';
import { getSocket } from '../../../lib/socket';

// Emits the local user's speaking state so other clients can ring their
// avatar in the sidebar / member list (LiveKit only knows speakers in-room).
export function LocalSpeakingRelay() {
  const { localParticipant } = useLocalParticipant();
  const speaking = useIsSpeaking(localParticipant);
  const last = useRef<boolean | null>(null);

  useEffect(() => {
    if (last.current === speaking) return;
    last.current = speaking;
    getSocket().emit('voice.speaking', { speaking });
  }, [speaking]);

  return null;
}
