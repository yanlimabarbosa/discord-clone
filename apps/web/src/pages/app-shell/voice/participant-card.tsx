import { memo, useRef, useState, type MouseEvent } from 'react';
import {
  useConnectionQualityIndicator,
  useIsSpeaking,
  VideoTrack,
  type TrackReferenceOrPlaceholder,
} from '@livekit/components-react';
import {
  ConnectionQuality,
  Track,
  RemoteParticipant,
  LocalParticipant,
} from 'livekit-client';
import { Maximize2, MicOff, HeadphoneOff } from 'lucide-react';
import { ParticipantContextMenu } from './participant-context-menu';
import { Tooltip } from '../../../components/tooltip';
import { useParticipantMuted } from '../../../hooks/voice/use-participant-muted';
import { useDeafenState } from '../../../hooks/voice/use-deafen-state';
import './voice-extras.css';

type ParticipantCardProps = {
  trackRef: TrackReferenceOrPlaceholder;
  onSelect?: () => void;
};

const QUALITY_LABEL: Record<ConnectionQuality, string> = {
  [ConnectionQuality.Excellent]: 'Connection: excellent',
  [ConnectionQuality.Good]: 'Connection: good',
  [ConnectionQuality.Poor]: 'Connection: poor',
  [ConnectionQuality.Lost]: 'Connection lost',
  [ConnectionQuality.Unknown]: 'Connection: unknown',
};

export const ParticipantCard = memo(function ParticipantCard({
  trackRef,
  onSelect,
}: ParticipantCardProps) {
  const participant = trackRef.participant;
  const speaking = useIsSpeaking(participant);
  const { quality } = useConnectionQualityIndicator({ participant });
  const micMuted = useParticipantMuted(participant);
  const isDeafened = !!useDeafenState()[participant.identity];
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
      const source = isScreen
        ? Track.Source.ScreenShareAudio
        : Track.Source.Microphone;
      (participant as RemoteParticipant).setVolume(
        isMuted ? 0 : vol / 100,
        source,
      );
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

      {isScreen && <span className="vc-live-badge">LIVE</span>}

      {hasVideo && (
        <Tooltip label="Fullscreen" side="bottom">
          <button
            className="vc-fullscreen"
            aria-label="Fullscreen"
            onClick={goFullscreen}
          >
            <Maximize2 size={16} />
          </button>
        </Tooltip>
      )}

      {!isScreen && (isDeafened || micMuted) && (
        <Tooltip label={isDeafened ? 'Deafened' : 'Muted'} side="bottom">
          <div className="vc-status-badge">
            {isDeafened ? <HeadphoneOff size={16} /> : <MicOff size={16} />}
          </div>
        </Tooltip>
      )}

      <div className="vc-name">
        <span>
          {name}
          {isScreen && ' — screen'}
        </span>
        {!isScreen && (isDeafened || micMuted) && (
          <span className="vc-name-icon">
            {isDeafened ? <HeadphoneOff size={14} /> : <MicOff size={14} />}
          </span>
        )}
        {muted && (
          <Tooltip label="Silenced by you">
            <span className="vc-name-icon">🔇</span>
          </Tooltip>
        )}
        {!isScreen && (
          <Tooltip label={QUALITY_LABEL[quality]} side="bottom">
            <span
              className={`vc-quality vc-quality-${quality}`}
              aria-label={QUALITY_LABEL[quality]}
            >
              <span />
              <span />
              <span />
            </span>
          </Tooltip>
        )}
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
});
