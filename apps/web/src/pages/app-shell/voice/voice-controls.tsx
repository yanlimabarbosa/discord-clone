import { useTrackToggle, useRoomContext } from '@livekit/components-react';
import { Track } from 'livekit-client';
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
  const mic = useTrackToggle({ source: Track.Source.Microphone });
  const cam = useTrackToggle({ source: Track.Source.Camera });
  const screen = useTrackToggle({ source: Track.Source.ScreenShare });

  return (
    <div className="vc-bar">
      <button
        className={`vc-ctrl-btn ${mic.enabled ? '' : 'vc-ctrl-danger'}`}
        title={mic.enabled ? 'Mute' : 'Unmute'}
        onClick={() => mic.toggle()}
      >
        {mic.enabled ? <Mic size={20} /> : <MicOff size={20} />}
      </button>
      <button
        className={`vc-ctrl-btn ${cam.enabled ? 'vc-ctrl-active' : ''}`}
        title={cam.enabled ? 'Turn off camera' : 'Turn on camera'}
        onClick={() => cam.toggle()}
      >
        {cam.enabled ? <Video size={20} /> : <VideoOff size={20} />}
      </button>
      <button
        className={`vc-ctrl-btn ${screen.enabled ? 'vc-ctrl-active' : ''}`}
        title={screen.enabled ? 'Stop sharing' : 'Share screen'}
        onClick={() => screen.toggle()}
      >
        {screen.enabled ? <ScreenShareOff size={20} /> : <ScreenShare size={20} />}
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
