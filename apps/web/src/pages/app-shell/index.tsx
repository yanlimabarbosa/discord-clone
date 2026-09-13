import '@livekit/components-styles';
import { LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react';
import { DisconnectReason, VideoPresets, type RoomOptions } from 'livekit-client';
import { useAppShell } from './use-app-shell';
import { ShellBody } from './shell-body';
import { VoiceSignals } from './voice/voice-signals';
import { LocalSpeakingRelay } from './voice/local-speaking-relay';
import { LocalMuteRelay } from './voice/local-mute-relay';
import { ConnectionBanner } from '../../components/connection-banner';

const serverUrl =
  import.meta.env.VITE_LIVEKIT_URL || `wss://${window.location.host}`;

const roomOptions: RoomOptions = {
  videoCaptureDefaults: { resolution: VideoPresets.h720.resolution },
  publishDefaults: {
    videoSimulcastLayers: [VideoPresets.h360, VideoPresets.h720],
    screenShareEncoding: { maxFramerate: 60, maxBitrate: 6_000_000 },
  },
};

// Reasons where the room is gone for good — anything else is a transient
// drop that LiveKit's reconnect machinery should be allowed to recover from
// without tearing down the call UI.
const TERMINAL_DISCONNECT_REASONS = new Set<DisconnectReason>([
  DisconnectReason.CLIENT_INITIATED,
  DisconnectReason.DUPLICATE_IDENTITY,
  DisconnectReason.SERVER_SHUTDOWN,
  DisconnectReason.PARTICIPANT_REMOVED,
  DisconnectReason.ROOM_DELETED,
  DisconnectReason.ROOM_CLOSED,
  DisconnectReason.JOIN_FAILURE,
  DisconnectReason.USER_REJECTED,
]);

export function AppShell() {
  const shell = useAppShell();

  const onVoiceDisconnected = (reason?: DisconnectReason) => {
    if (reason === undefined || TERMINAL_DISCONNECT_REASONS.has(reason)) {
      shell.leaveVoice();
    }
  };

  const body =
    shell.voice && shell.voiceToken ? (
      <LiveKitRoom
        key={shell.voice.id}
        token={shell.voiceToken}
        serverUrl={serverUrl}
        options={roomOptions}
        connect
        audio
        video={false}
        onDisconnected={onVoiceDisconnected}
        style={{ height: '100%' }}
      >
        <RoomAudioRenderer />
        <VoiceSignals channelId={shell.voice.id} />
        <LocalSpeakingRelay />
        <LocalMuteRelay />
        <ShellBody shell={shell} inVoice />
      </LiveKitRoom>
    ) : (
      <ShellBody shell={shell} inVoice={false} />
    );

  return (
    <>
      <ConnectionBanner />
      {body}
    </>
  );
}
