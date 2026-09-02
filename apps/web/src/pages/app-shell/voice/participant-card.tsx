import { useRef, useState, type MouseEvent } from 'react';
import {
  useIsSpeaking,
  VideoTrack,
  type TrackReferenceOrPlaceholder,
} from '@livekit/components-react';
import { Track, RemoteParticipant, LocalParticipant } from 'livekit-client';
import { Maximize2 } from 'lucide-react';
import { ParticipantContextMenu } from './participant-context-menu';

type ParticipantCardProps = {
  trackRef: TrackReferenceOrPlaceholder;
  onSelect?: () => void;
};

export function ParticipantCard({ trackRef, onSelect }: ParticipantCardProps) {
  const participant = trackRef.participant;
  const speaking = useIsSpeaking(participant);
  const isScreen = trackRef.source === Track.Source.ScreenShare;
  const hasVideo = !!trackRef.publication && !trackRef.publication.isMuted;
  const name = participant.name || participant.identity;
  const initial = name.charAt(0).toUpperCase();
  const isRemote = participant instanceof RemoteParticipant;
  const isLocal = participant instanceof LocalParticipant;

  const [volume, setVolume] = useState(100);
  const [muted, setMuted] = useState(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const tileRef = useRef<HTMLDivElement>(null);

  function goFullscreen(e: MouseEvent) {
    e.stopPropagation();
    tileRef.current?.requestFullscreen?.();
  }

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

  function onContextMenu(e: MouseEvent) {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
  }

  return (
    <div
      ref={tileRef}
      className={`vc-tile ${speaking && !isScreen ? 'vc-speaking' : ''}`}
      onContextMenu={onContextMenu}
      onClick={onSelect}
    >
      {hasVideo ? (
        <VideoTrack
          trackRef={trackRef as never}
          className={isScreen ? 'vc-video vc-video-contain' : 'vc-video'}
        />
      ) : (
        <div className={`vc-avatar-big ${speaking ? 'vc-avatar-speaking' : ''}`}>
          {initial}
        </div>
      )}

      {hasVideo && (
        <button
          className="vc-fullscreen"
          title="Fullscreen"
          onClick={goFullscreen}
        >
          <Maximize2 size={16} />
        </button>
      )}

      <div className="vc-name">
        {name}
        {isScreen && ' — screen'}
        {muted && !isScreen && ' 🔇'}
      </div>

      {menuPos && (
        <ParticipantContextMenu
          x={menuPos.x}
          y={menuPos.y}
          name={name}
          isLocal={isLocal}
          muted={muted}
          volume={volume}
          onToggleMute={toggleMute}
          onVolumeChange={onVolume}
          onClose={() => setMenuPos(null)}
        />
      )}
    </div>
  );
}
