import '@livekit/components-styles';
import { LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react';
import { useAppShell } from './use-app-shell';
import { ShellBody } from './shell-body';
import { VoiceSignals } from './voice/voice-signals';
import { LocalSpeakingRelay } from './voice/local-speaking-relay';
import { LocalMuteRelay } from './voice/local-mute-relay';

const serverUrl =
  import.meta.env.VITE_LIVEKIT_URL || `wss://${window.location.host}`;

export function AppShell() {
  const shell = useAppShell();

  if (shell.voice && shell.voiceToken) {
    return (
      <LiveKitRoom
        key={shell.voice.id}
        token={shell.voiceToken}
        serverUrl={serverUrl}
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
