import '@livekit/components-styles';
import { LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react';
import { VideoPresets, type RoomOptions } from 'livekit-client';
import { useAppShell } from './use-app-shell';
import { ShellBody } from './shell-body';
import { VoiceSignals } from './voice/voice-signals';
import { LocalSpeakingRelay } from './voice/local-speaking-relay';
import { LocalMuteRelay } from './voice/local-mute-relay';

const serverUrl =
  import.meta.env.VITE_LIVEKIT_URL || `wss://${window.location.host}`;

const roomOptions: RoomOptions = {
  videoCaptureDefaults: { resolution: VideoPresets.h720.resolution },
  publishDefaults: {
    videoSimulcastLayers: [VideoPresets.h360, VideoPresets.h720],
    screenShareEncoding: { maxFramerate: 60, maxBitrate: 6_000_000 },
  },
};

export function AppShell() {
  const shell = useAppShell();

  if (shell.voice && shell.voiceToken) {
    return (
      <LiveKitRoom
        key={shell.voice.id}
        token={shell.voiceToken}
        serverUrl={serverUrl}
        options={roomOptions}
        connect
        audio
        video={false}
        onDisconnected={shell.leaveVoice}
        style={{ height: '100%' }}
      >
        <RoomAudioRenderer />
        <VoiceSignals channelId={shell.voice.id} />
        <LocalSpeakingRelay />
        <LocalMuteRelay />
        <ShellBody shell={shell} inVoice />
      </LiveKitRoom>
    );
  }

  return <ShellBody shell={shell} inVoice={false} />;
}
