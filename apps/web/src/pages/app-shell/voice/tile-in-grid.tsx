import { useMaybeTrackRefContext } from '@livekit/components-react';
import { ParticipantCard } from './participant-card';

type TileInGridProps = {
  onFocus: (key: string) => void;
};

// GridLayout clones this per track and supplies the track via context.
export function TileInGrid({ onFocus }: TileInGridProps) {
  const trackRef = useMaybeTrackRefContext();
  if (!trackRef) return null;
  const key = `${trackRef.participant.sid}-${trackRef.source}`;
  return <ParticipantCard trackRef={trackRef} onSelect={() => onFocus(key)} />;
}
