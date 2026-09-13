import { useSyncExternalStore } from 'react';
import { Mic, MicOff, Headphones, HeadphoneOff } from 'lucide-react';
import { voicePrefStore } from '../../../lib/voice-pref-store';
import { Tooltip } from '../../../components/tooltip';

// Shown while not connected to voice: toggles the persisted preference that
// gets applied when a voice channel is joined.
export function PrefVoiceToggles() {
  const prefs = useSyncExternalStore(
    voicePrefStore.subscribe,
    voicePrefStore.getSnapshot,
  );

  return (
    <div className="user-panel-voice">
      <Tooltip label={prefs.muted ? 'Unmute' : 'Mute'}>
        <button
          className={`icon-btn ${prefs.muted ? 'user-panel-voice-off' : ''}`}
          aria-label={prefs.muted ? 'Unmute microphone' : 'Mute microphone'}
          aria-pressed={prefs.muted}
          onClick={() =>
            voicePrefStore.set({ ...prefs, muted: !prefs.muted })
          }
        >
          {prefs.muted ? <MicOff size={16} /> : <Mic size={16} />}
        </button>
      </Tooltip>
      <Tooltip label={prefs.deafened ? 'Undeafen' : 'Deafen'}>
        <button
          className={`icon-btn ${prefs.deafened ? 'user-panel-voice-off' : ''}`}
          aria-label={prefs.deafened ? 'Undeafen' : 'Deafen'}
          aria-pressed={prefs.deafened}
          onClick={() =>
            voicePrefStore.set({ ...prefs, deafened: !prefs.deafened })
          }
        >
          {prefs.deafened ? (
            <HeadphoneOff size={16} />
          ) : (
            <Headphones size={16} />
          )}
        </button>
      </Tooltip>
    </div>
  );
}
