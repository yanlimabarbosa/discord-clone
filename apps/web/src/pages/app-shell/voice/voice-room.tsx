import { useTracks, ControlBar, RoomAudioRenderer } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { ParticipantCard } from './participant-card';

export function VoiceRoom() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  return (
    <div className="vc-room">
      <div className="vc-grid">
        {tracks.map((t, i) => (
          <ParticipantCard
            key={`${t.participant.sid}-${t.source}-${i}`}
            trackRef={t}
          />
        ))}
      </div>
      <RoomAudioRenderer />
      <div className="vc-controls">
        <ControlBar controls={{ chat: false, leave: true }} />
      </div>
    </div>
  );
}
