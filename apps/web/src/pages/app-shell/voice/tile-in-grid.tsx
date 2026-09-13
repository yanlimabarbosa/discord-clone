import { useCallback } from 'react';
import { useMaybeTrackRefContext } from '@livekit/components-react';
import { ParticipantCard } from './participant-card';

type TileInGridProps = {
  onFocus: (key: string) => void;
};

// GridLayout clones this per track and supplies the track via context.
export function TileInGrid({ onFocus }: TileInGridProps) {
  const trackRef = useMaybeTrackRefContext();
  const key = trackRef ? `${trackRef.participant.sid}-${trackRef.source}` : '';
  const onSelect = useCallback(() => onFocus(key), [onFocus, key]);
  if (!trackRef) return null;
  return <ParticipantCard trackRef={trackRef} onSelect={onSelect} />;
}
