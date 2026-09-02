import '@livekit/components-styles';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import { useVoiceToken } from '../../hooks/voice/use-voice-token';
import type { Channel } from '../../types/server';

const serverUrl = `wss://${window.location.host}`;

type VoiceViewProps = {
  channel: Channel;
  onLeave: () => void;
};

export function VoiceView({ channel, onLeave }: VoiceViewProps) {
  const { data, isLoading, error } = useVoiceToken(channel.id);

  if (isLoading) {
    return (
      <main className="content">
        <div className="content-empty">
          <div className="content-empty-logo">🔊</div>
          <h2>Connecting to {channel.name}…</h2>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="content">
        <div className="content-empty">
          <div className="content-empty-logo">🔊</div>
          <h2>Couldn't join {channel.name}</h2>
          <p>Try again in a moment.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="content content-voice" data-lk-theme="default">
      <LiveKitRoom
        token={data.token}
        serverUrl={serverUrl}
        connect
        video
        audio
        onDisconnected={onLeave}
        style={{ height: '100%' }}
      >
        <VideoConference />
      </LiveKitRoom>
    </main>
  );
}
