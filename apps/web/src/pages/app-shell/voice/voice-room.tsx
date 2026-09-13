import { useCallback, useState } from 'react';
import {
  useTracks,
  useConnectionState,
  GridLayout,
  RoomAudioRenderer,
  type TrackReferenceOrPlaceholder,
} from '@livekit/components-react';
import { ConnectionState, Track } from 'livekit-client';
import { ParticipantCard } from './participant-card';
import { TileInGrid } from './tile-in-grid';
import { VoiceSounds } from './voice-sounds';
import { VoiceControls } from './voice-controls';
import { WatchTheater } from './watch-theater';
import './voice-extras.css';

type VoiceRoomProps = {
  channelId: string;
  watchOpen: boolean;
};

function trackKey(t: TrackReferenceOrPlaceholder): string {
  return `${t.participant.sid}-${t.source}`;
}

function StripTile({
  trackRef,
  onFocus,
}: {
  trackRef: TrackReferenceOrPlaceholder;
  onFocus?: (key: string) => void;
}) {
  const key = trackKey(trackRef);
  const onSelect = useCallback(() => onFocus?.(key), [onFocus, key]);
  return (
    <div className="vc-strip-item">
      <ParticipantCard
        trackRef={trackRef}
        onSelect={onFocus ? onSelect : undefined}
      />
    </div>
  );
}

export function VoiceRoom({ channelId, watchOpen }: VoiceRoomProps) {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );
  const connectionState = useConnectionState();
  const reconnecting =
    connectionState === ConnectionState.Reconnecting ||
    connectionState === ConnectionState.SignalReconnecting;

  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  const clearFocus = useCallback(() => setFocusedKey(null), []);
  const focused = focusedKey
    ? tracks.find((t) => trackKey(t) === focusedKey)
    : null;

  return (
    <div className="vc-room">
      <VoiceSounds />

      {reconnecting && (
        <div className="vc-reconnecting" role="status">
          <span className="vc-reconnecting-dot" />
          Voice reconnecting…
        </div>
      )}

      {watchOpen ? (
        <>
          <div className="vc-watch-area">
            <WatchTheater channelId={channelId} />
          </div>
          <div className="vc-strip vc-watch-strip">
            {tracks.map((t) => (
              <StripTile key={trackKey(t)} trackRef={t} />
            ))}
          </div>
        </>
      ) : focused ? (
        <div className="vc-stage-focus">
          <div className="vc-focused">
            <ParticipantCard trackRef={focused} onSelect={clearFocus} />
          </div>
          {tracks.length > 1 && (
            <div className="vc-strip">
              {tracks
                .filter((t) => trackKey(t) !== focusedKey)
                .map((t) => (
                  <StripTile
                    key={trackKey(t)}
                    trackRef={t}
                    onFocus={setFocusedKey}
                  />
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
