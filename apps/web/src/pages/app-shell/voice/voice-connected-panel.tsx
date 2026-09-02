import { useLocalParticipant } from '@livekit/components-react';
import type { ActiveVoice } from '../use-app-shell';

type VoiceConnectedPanelProps = {
  voice: ActiveVoice;
  onView: () => void;
  onLeave: () => void;
};

export function VoiceConnectedPanel({
  voice,
  onView,
  onLeave,
}: VoiceConnectedPanelProps) {
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();

  return (
    <div className="voice-connected">
      <div className="voice-connected-info" onClick={onView}>
        <span className="voice-connected-status">🔊 Voice Connected</span>
        <span className="voice-connected-where">
          {voice.name} / {voice.serverName}
        </span>
      </div>
      <div className="voice-connected-actions">
        <button
          className="icon-btn"
          title={isMicrophoneEnabled ? 'Mute' : 'Unmute'}
          onClick={() =>
            localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)
          }
        >
          {isMicrophoneEnabled ? '🎙️' : '🔇'}
        </button>
        <button className="icon-btn icon-btn-danger" title="Disconnect" onClick={onLeave}>
          ⏻
        </button>
      </div>
    </div>
  );
}
