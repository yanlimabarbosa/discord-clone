import { useEffect } from 'react';
import { useLocalParticipant, useRoomContext } from '@livekit/components-react';
import type { Room } from 'livekit-client';
import { Mic, MicOff, Headphones, HeadphoneOff } from 'lucide-react';
import { useDeafenState } from '../../../hooks/voice/use-deafen-state';
import { useVoiceForce } from '../../../hooks/voice/use-voice-force';
import { voicePrefStore } from '../../../lib/voice-pref-store';
import { Tooltip } from '../../../components/tooltip';

type LiveVoiceTogglesProps = {
  userId: string | undefined;
};

// One application of the persisted mute preference per room connection, so a
// remount of the sidebar doesn't re-mute someone who unmuted mid-call.
const prefApplied = new WeakSet<Room>();

// Shown while connected to voice: the mic button drives the live room state
// (same source the voice bar reads). Deafen state lives inside the voice
// bar's own component, so here it is display-only.
export function LiveVoiceToggles({ userId }: LiveVoiceTogglesProps) {
  const room = useRoomContext();
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();
  const deafenMap = useDeafenState();
  const force = useVoiceForce();
  const deafened = userId ? !!deafenMap[userId] : false;

  useEffect(() => {
    if (prefApplied.has(room)) return;
    prefApplied.add(room);
    if (voicePrefStore.getSnapshot().muted) {
      localParticipant.setMicrophoneEnabled(false);
    }
  }, [room, localParticipant]);

  const micLocked = force.muted || deafened;
  const micOn = isMicrophoneEnabled && !force.muted;

  function toggleMic() {
    if (micLocked) return;
    const next = !isMicrophoneEnabled;
    localParticipant.setMicrophoneEnabled(next);
    voicePrefStore.set({ ...voicePrefStore.getSnapshot(), muted: !next });
  }

  return (
    <div className="user-panel-voice">
      <Tooltip
        label={
          force.muted
            ? 'Server muted'
            : deafened
              ? 'Undeafen in the voice bar'
              : micOn
                ? 'Mute'
                : 'Unmute'
        }
      >
        <button
          className={`icon-btn ${micOn ? '' : 'user-panel-voice-off'}`}
          aria-label={
            force.muted
              ? 'Server muted'
              : micOn
                ? 'Mute microphone'
                : 'Unmute microphone'
          }
          aria-pressed={!micOn}
          onClick={toggleMic}
          disabled={micLocked}
        >
          {micOn ? <Mic size={16} /> : <MicOff size={16} />}
        </button>
      </Tooltip>
      <Tooltip
        label={
          force.deafened
            ? 'Server deafened'
            : deafened
              ? 'Deafened — use the voice bar to undeafen'
              : 'Deafen from the voice bar'
        }
      >
        <button
          className={`icon-btn ${deafened ? 'user-panel-voice-off' : ''}`}
          aria-label={deafened ? 'Deafened' : 'Deafen (available in the voice bar)'}
          aria-pressed={deafened}
          disabled
        >
          {deafened ? <HeadphoneOff size={16} /> : <Headphones size={16} />}
        </button>
      </Tooltip>
    </div>
  );
}
