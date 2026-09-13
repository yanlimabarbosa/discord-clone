import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { clampMenuPosition } from '../../../lib/clamp-menu-position';
import './voice-context-menu.css';

type ParticipantContextMenuProps = {
  x: number;
  y: number;
  name: string;
  isLocal: boolean;
  muted: boolean;
  /** Volume as a percentage, 0-200. */
  volume: number;
  onToggleMute: () => void;
  onVolumeChange: (volume: number) => void;
  onClose: () => void;
};

export function ParticipantContextMenu({
  x,
  y,
  name,
  isLocal,
  muted,
  volume,
  onToggleMute,
  onVolumeChange,
  onClose,
}: ParticipantContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x, top: y });

  useLayoutEffect(() => {
    setPos(clampMenuPosition(x, y, ref.current));
  }, [x, y]);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="vc-ctx"
      style={{ left: pos.left, top: pos.top }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="vc-ctx-header">{name}</div>

      {isLocal ? (
        <div className="vc-ctx-note">This is you</div>
      ) : (
        <>
          <button className="vc-ctx-item" onClick={onToggleMute}>
            <span>Mute for me</span>
            <span>{muted ? '✓' : ''}</span>
          </button>

          <div className="vc-ctx-vol">
            <div className="vc-ctx-vol-label">
              <span>Volume</span>
              <span>{Math.round(volume)}%</span>
            </div>
            <input
              className="vc-ctx-slider"
              type="range"
              min={0}
              max={200}
              value={muted ? 0 : volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
            />
          </div>
        </>
      )}
    </div>
  );
}
