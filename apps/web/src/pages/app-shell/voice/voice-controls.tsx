import { useLocalParticipant, useRoomContext } from '@livekit/components-react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  ScreenShareOff,
  PhoneOff,
} from 'lucide-react';

export function VoiceControls() {
  const room = useRoomContext();
  const {
    localParticipant,
    isMicrophoneEnabled,
    isCameraEnabled,
    isScreenShareEnabled,
  } = useLocalParticipant();

  return (
    <div className="vc-bar">
      <button
        className={`vc-ctrl-btn ${isMicrophoneEnabled ? '' : 'vc-ctrl-danger'}`}
        title={isMicrophoneEnabled ? 'Mute' : 'Unmute'}
        onClick={() =>
          localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)
        }
      >
        {isMicrophoneEnabled ? <Mic size={20} /> : <MicOff size={20} />}
      </button>
      <button
        className={`vc-ctrl-btn ${isCameraEnabled ? 'vc-ctrl-active' : ''}`}
        title={isCameraEnabled ? 'Turn off camera' : 'Turn on camera'}
        onClick={() => localParticipant.setCameraEnabled(!isCameraEnabled)}
      >
        {isCameraEnabled ? <Video size={20} /> : <VideoOff size={20} />}
      </button>
      <button
        className={`vc-ctrl-btn ${isScreenShareEnabled ? 'vc-ctrl-active' : ''}`}
        title={isScreenShareEnabled ? 'Stop sharing' : 'Share screen (with audio)'}
        onClick={() =>
          localParticipant.setScreenShareEnabled(!isScreenShareEnabled, {
            audio: true,
          })
        }
      >
        {isScreenShareEnabled ? (
          <ScreenShareOff size={20} />
        ) : (
          <ScreenShare size={20} />
        )}
      </button>
      <button
        className="vc-ctrl-btn vc-ctrl-leave"
        title="Disconnect"
        onClick={() => room.disconnect()}
      >
        <PhoneOff size={20} />
      </button>
    </div>
  );
}
