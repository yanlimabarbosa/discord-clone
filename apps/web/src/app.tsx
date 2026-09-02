import '@livekit/components-styles';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import { JoinForm } from './join-form';
import { useJoinRoom } from './use-join-room';

const serverUrl = `wss://${window.location.host}`;

export function App() {
  const { token, error, connecting, join, leave } = useJoinRoom();

  if (token === '') {
    return <JoinForm connecting={connecting} error={error} onJoin={join} />;
  }

  return (
    <div style={{ height: '100vh' }} data-lk-theme="default">
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        connect
        video
        audio
        onDisconnected={leave}
      >
        <VideoConference />
      </LiveKitRoom>
    </div>
  );
}
