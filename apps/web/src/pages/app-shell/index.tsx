import '@livekit/components-styles';
import { LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react';
import { useAppShell } from './use-app-shell';
import { ShellBody } from './shell-body';
import { VoiceSignals } from './voice/voice-signals';

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
        video
        onDisconnected={shell.leaveVoice}
        style={{ height: '100%' }}
      >
        <RoomAudioRenderer />
        <VoiceSignals channelId={shell.voice.id} />
        <ShellBody shell={shell} inVoice />
      </LiveKitRoom>
    );
  }

  return <ShellBody shell={shell} inVoice={false} />;
}
