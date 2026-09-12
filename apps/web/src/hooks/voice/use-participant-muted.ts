import { useEffect, useState } from 'react';
import { Participant, ParticipantEvent } from 'livekit-client';

// Tracks whether a participant's microphone is muted (or not published at all).
// LiveKit propagates mute state to every peer, so this works for remotes too.
export function useParticipantMuted(participant: Participant): boolean {
  const [muted, setMuted] = useState(!participant.isMicrophoneEnabled);

  useEffect(() => {
    const update = () => setMuted(!participant.isMicrophoneEnabled);
    update();
    participant.on(ParticipantEvent.TrackMuted, update);
    participant.on(ParticipantEvent.TrackUnmuted, update);
    participant.on(ParticipantEvent.TrackPublished, update);
    participant.on(ParticipantEvent.TrackUnpublished, update);
    participant.on(ParticipantEvent.LocalTrackPublished, update);
    participant.on(ParticipantEvent.LocalTrackUnpublished, update);
    return () => {
      participant.off(ParticipantEvent.TrackMuted, update);
      participant.off(ParticipantEvent.TrackUnmuted, update);
      participant.off(ParticipantEvent.TrackPublished, update);
      participant.off(ParticipantEvent.TrackUnpublished, update);
      participant.off(ParticipantEvent.LocalTrackPublished, update);
      participant.off(ParticipantEvent.LocalTrackUnpublished, update);
    };
  }, [participant]);

  return muted;
}
