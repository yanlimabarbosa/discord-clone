import '@livekit/components-styles';
import { LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react';
import {
  DisconnectReason,
  VideoPresets,
  type RoomOptions,
} from 'livekit-client';
import { useState, type ReactNode } from 'react';
import { VoiceSignals } from './voice/voice-signals';
import { LocalSpeakingRelay } from './voice/local-speaking-relay';
import { LocalMuteRelay } from './voice/local-mute-relay';
import { RnnoiseRelay } from './voice/rnnoise-relay';
import { voiceAudioStore } from '../../lib/voice-audio-store';

// Everything LiveKit lives behind this module: it is only ever imported via
// React.lazy from the app shell, so the LiveKit SDK stays out of the entry
// chunk and never loads until a voice channel is actually joined.

const serverUrl =
  import.meta.env.VITE_LIVEKIT_URL || `wss://${window.location.host}`;

// Built per join (the room remounts on voiceId change) so the persisted
// voice-processing settings are read fresh each time a call starts.
function buildRoomOptions(): RoomOptions {
  const audio = voiceAudioStore.getSnapshot();
  return {
    videoCaptureDefaults: { resolution: VideoPresets.h720.resolution },
    audioCaptureDefaults: {
      echoCancellation: audio.echoCancellation,
      noiseSuppression: audio.noiseSuppression,
      autoGainControl: audio.autoGainControl,
    },
    publishDefaults: {
      videoSimulcastLayers: [VideoPresets.h360, VideoPresets.h720],
      screenShareEncoding: { maxFramerate: 60, maxBitrate: 6_000_000 },
    },
  };
}

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

type VoiceShellProps = {
  voiceId: string;
  token: string;
  onLeaveVoice: () => void;
  children: ReactNode;
};

export default function VoiceShell({
  voiceId,
  token,
  onLeaveVoice,
  children,
}: VoiceShellProps) {
  const [roomOptions] = useState(buildRoomOptions);
  const onVoiceDisconnected = (reason?: DisconnectReason) => {
    if (reason === undefined || TERMINAL_DISCONNECT_REASONS.has(reason)) {
      onLeaveVoice();
    }
  };

  return (
    <LiveKitRoom
      key={voiceId}
      token={token}
      serverUrl={serverUrl}
      options={roomOptions}
      connect
      audio
      video={false}
      onDisconnected={onVoiceDisconnected}
      style={{ height: '100%' }}
    >
      <RoomAudioRenderer />
      <VoiceSignals channelId={voiceId} />
      <LocalSpeakingRelay />
      <LocalMuteRelay />
      <RnnoiseRelay />
      {children}
    </LiveKitRoom>
  );
}
