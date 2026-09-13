import { useEffect, useRef, useState } from 'react';
import { useLocalParticipant, useRoomContext } from '@livekit/components-react';
import {
  Mic,
  MicOff,
  Headphones,
  Video,
  VideoOff,
  ScreenShare,
  ScreenShareOff,
  Radio,
  PhoneOff,
} from 'lucide-react';
import { useDeafen } from '../../../hooks/voice/use-deafen';
import { usePushToTalk } from '../../../hooks/voice/use-push-to-talk';
import { useVoiceForce } from '../../../hooks/voice/use-voice-force';
import { DevicePicker } from './device-picker';
import './voice-controls.css';

export function VoiceControls() {
  const room = useRoomContext();
  const {
    localParticipant,
    isMicrophoneEnabled,
    isCameraEnabled,
    isScreenShareEnabled,
  } = useLocalParticipant();
  const { deafened, toggle: toggleDeafen } = useDeafen(room);
  const [ptt, setPtt] = useState(false);
  usePushToTalk(localParticipant, ptt);
  const force = useVoiceForce();
  const forcedDeafenRef = useRef(false);

  // A moderator server-muted us: force mic off.
  useEffect(() => {
    if (force.muted) localParticipant.setMicrophoneEnabled(false);
  }, [force.muted, localParticipant]);

  // Server-deafen: drive the local deafen state to match.
  useEffect(() => {
    if (force.deafened && !deafened) {
      toggleDeafen();
      forcedDeafenRef.current = true;
    } else if (!force.deafened && forcedDeafenRef.current && deafened) {
      toggleDeafen();
      forcedDeafenRef.current = false;
    }
  }, [force.deafened, deafened, toggleDeafen]);

  const locked = force.muted || force.deafened;

  // Discord semantics: mic and deafen are coupled. Clicking mic while
  // deafened un-deafens and unmutes; you can never be deafened + mic-on.
  function toggleMic() {
    if (locked) return;
    if (deafened) {
      toggleDeafen();
      localParticipant.setMicrophoneEnabled(true);
      return;
    }
    localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
  }

  const micOn = isMicrophoneEnabled && !deafened && !force.muted;

  return (
    <div className="vc-bar">
      <button
        className={`vc-ctrl-btn ${micOn ? '' : 'vc-ctrl-danger'}`}
        title={force.muted ? 'Server muted' : micOn ? 'Mute' : 'Unmute'}
        aria-label={force.muted ? 'Server muted' : micOn ? 'Mute microphone' : 'Unmute microphone'}
        aria-pressed={!micOn}
        onClick={toggleMic}
        disabled={ptt || locked}
      >
        {micOn ? <Mic size={20} /> : <MicOff size={20} />}
      </button>
      <button
        className={`vc-ctrl-btn ${deafened ? 'vc-ctrl-danger' : ''}`}
        title={
          force.deafened ? 'Server deafened' : deafened ? 'Undeafen' : 'Deafen'
        }
        aria-label={force.deafened ? 'Server deafened' : deafened ? 'Undeafen' : 'Deafen'}
        aria-pressed={deafened}
        onClick={toggleDeafen}
        disabled={force.deafened}
      >
        <Headphones size={20} />
      </button>
      <button
        className={`vc-ctrl-btn ${ptt ? 'vc-ctrl-active' : ''}`}
        title={ptt ? 'Push-to-talk on (hold Space)' : 'Enable push-to-talk'}
        aria-label={ptt ? 'Disable push-to-talk' : 'Enable push-to-talk (hold Space)'}
        aria-pressed={ptt}
        onClick={() => setPtt((p) => !p)}
      >
        <Radio size={20} />
      </button>
      <button
        className={`vc-ctrl-btn ${isCameraEnabled ? 'vc-ctrl-active' : ''}`}
        title={isCameraEnabled ? 'Turn off camera' : 'Turn on camera'}
        aria-label={isCameraEnabled ? 'Turn off camera' : 'Turn on camera'}
        aria-pressed={isCameraEnabled}
        onClick={() => localParticipant.setCameraEnabled(!isCameraEnabled)}
      >
        {isCameraEnabled ? <Video size={20} /> : <VideoOff size={20} />}
      </button>
      <button
        className={`vc-ctrl-btn ${isScreenShareEnabled ? 'vc-ctrl-active' : ''}`}
        title={isScreenShareEnabled ? 'Stop sharing' : 'Share screen (with audio)'}
        aria-label={isScreenShareEnabled ? 'Stop screen share' : 'Share screen with audio'}
        aria-pressed={isScreenShareEnabled}
        onClick={() =>
          localParticipant.setScreenShareEnabled(!isScreenShareEnabled, {
            audio: true,
            contentHint: 'motion',
            resolution: { width: 1920, height: 1080, frameRate: 60 },
          })
        }
      >
        {isScreenShareEnabled ? (
          <ScreenShareOff size={20} />
        ) : (
          <ScreenShare size={20} />
        )}
      </button>
      <DevicePicker />
      <button
        className="vc-ctrl-btn vc-ctrl-leave"
        title="Disconnect"
        aria-label="Disconnect from voice"
        onClick={() => room.disconnect()}
      >
        <PhoneOff size={20} />
      </button>
    </div>
  );
}
