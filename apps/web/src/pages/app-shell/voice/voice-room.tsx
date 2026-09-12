import { useState } from 'react';
import {
  useTracks,
  GridLayout,
  RoomAudioRenderer,
  type TrackReferenceOrPlaceholder,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { ParticipantCard } from './participant-card';
import { TileInGrid } from './tile-in-grid';
import { VoiceSounds } from './voice-sounds';
import { VoiceControls } from './voice-controls';
import { WatchTheater } from './watch-theater';

type VoiceRoomProps = {
  channelId: string;
  watchOpen: boolean;
};

function trackKey(t: TrackReferenceOrPlaceholder): string {
  return `${t.participant.sid}-${t.source}`;
}

export function VoiceRoom({ channelId, watchOpen }: VoiceRoomProps) {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  const focused = focusedKey
    ? tracks.find((t) => trackKey(t) === focusedKey)
    : null;

  return (
    <div className="vc-room">
      <VoiceSounds />

      {watchOpen ? (
        <>
          <div className="vc-watch-area">
            <WatchTheater channelId={channelId} />
          </div>
          <div className="vc-strip vc-watch-strip">
            {tracks.map((t) => (
              <div className="vc-strip-item" key={trackKey(t)}>
                <ParticipantCard trackRef={t} />
              </div>
            ))}
          </div>
        </>
      ) : focused ? (
        <div className="vc-stage-focus">
          <div className="vc-focused">
            <ParticipantCard
              trackRef={focused}
              onSelect={() => setFocusedKey(null)}
            />
          </div>
          {tracks.length > 1 && (
            <div className="vc-strip">
              {tracks
                .filter((t) => trackKey(t) !== focusedKey)
                .map((t) => (
                  <div className="vc-strip-item" key={trackKey(t)}>
                    <ParticipantCard
                      trackRef={t}
                      onSelect={() => setFocusedKey(trackKey(t))}
                    />
                  </div>
                ))}
            </div>
          )}
        </div>
      ) : (
        <div className="vc-grid-area">
          <GridLayout tracks={tracks}>
            <TileInGrid onFocus={setFocusedKey} />
          </GridLayout>
        </div>
      )}

      <RoomAudioRenderer />
      <div className="vc-controls">
        <VoiceControls />
      </div>
    </div>
  );
}
