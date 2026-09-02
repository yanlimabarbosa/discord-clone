import { useState } from 'react';
import {
  useTracks,
  RoomAudioRenderer,
  type TrackReferenceOrPlaceholder,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { ParticipantCard } from './participant-card';
import { VoiceSounds } from './voice-sounds';
import { VoiceControls } from './voice-controls';

function trackKey(t: TrackReferenceOrPlaceholder): string {
  return `${t.participant.sid}-${t.source}`;
}

export function VoiceRoom() {
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

      {focused ? (
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
        <div className="vc-grid">
          {tracks.map((t) => (
            <ParticipantCard
              key={trackKey(t)}
              trackRef={t}
              onSelect={() => setFocusedKey(trackKey(t))}
            />
          ))}
        </div>
      )}

      <RoomAudioRenderer />
      <div className="vc-controls">
        <VoiceControls />
      </div>
    </div>
  );
}
