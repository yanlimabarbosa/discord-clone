import { useLocalParticipant } from '@livekit/components-react';
import { Mic, MicOff, PhoneOff, Volume2 } from 'lucide-react';
import { Tooltip } from '../../../components/tooltip';
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
        <span className="voice-connected-status">
          <Volume2 size={14} /> Voice Connected
        </span>
        <span className="voice-connected-where">
          {voice.name} / {voice.serverName}
        </span>
      </div>
      <div className="voice-connected-actions">
        <Tooltip label={isMicrophoneEnabled ? 'Mute' : 'Unmute'}>
          <button
            className="icon-btn"
            aria-label={isMicrophoneEnabled ? 'Mute' : 'Unmute'}
            onClick={() =>
              localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)
            }
          >
            {isMicrophoneEnabled ? <Mic size={16} /> : <MicOff size={16} />}
          </button>
        </Tooltip>
        <Tooltip label="Disconnect">
          <button
            className="icon-btn icon-btn-danger"
            aria-label="Disconnect"
            onClick={onLeave}
          >
            <PhoneOff size={16} />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
