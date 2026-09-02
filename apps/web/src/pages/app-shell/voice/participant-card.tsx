import { useState } from 'react';
import {
  useIsSpeaking,
  VideoTrack,
  type TrackReferenceOrPlaceholder,
} from '@livekit/components-react';
import { Track, RemoteParticipant } from 'livekit-client';

type ParticipantCardProps = {
  trackRef: TrackReferenceOrPlaceholder;
};

export function ParticipantCard({ trackRef }: ParticipantCardProps) {
  const participant = trackRef.participant;
  const speaking = useIsSpeaking(participant);
  const isScreen = trackRef.source === Track.Source.ScreenShare;
  const hasVideo = !!trackRef.publication && !trackRef.publication.isMuted;
  const name = participant.name || participant.identity;
  const initial = name.charAt(0).toUpperCase();
  const isRemote = participant instanceof RemoteParticipant;

  const [volume, setVolume] = useState(100);
  const [muted, setMuted] = useState(false);

  function apply(vol: number, isMuted: boolean) {
    if (isRemote) {
      (participant as RemoteParticipant).setVolume(isMuted ? 0 : vol / 100);
    }
  }
  function onVolume(v: number) {
    setVolume(v);
    setMuted(v === 0);
    apply(v, v === 0);
  }
  function toggleMute() {
    const next = !muted;
    setMuted(next);
    apply(volume, next);
  }

  return (
    <div className={`vc-tile ${speaking && !isScreen ? 'vc-speaking' : ''}`}>
      {hasVideo ? (
        <VideoTrack
          trackRef={trackRef as never}
          className="vc-video"
        />
      ) : (
        <div className="vc-avatar-big">{initial}</div>
      )}

      <div className="vc-name">
        {name}
        {isScreen && ' — screen'}
        {muted && !isScreen && ' 🔇'}
      </div>

      {isRemote && !isScreen && (
        <div className="vc-vol">
          <button className="vc-vol-btn" onClick={toggleMute} title="Mute for me">
            {muted ? '🔇' : '🔊'}
          </button>
          <input
            className="vc-vol-slider"
            type="range"
            min={0}
            max={100}
            value={muted ? 0 : volume}
            onChange={(e) => onVolume(Number(e.target.value))}
          />
        </div>
      )}
    </div>
  );
}
