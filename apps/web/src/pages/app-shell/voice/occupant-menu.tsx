import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { MicOff, Mic, HeadphoneOff, Headphones, MoveRight } from 'lucide-react';
import type { Channel } from '../../../types/server';
import { clampMenuPosition } from '../../../lib/clamp-menu-position';

type OccupantMenuProps = {
  x: number;
  y: number;
  voiceChannels: Channel[];
  canMove: boolean;
  canMute: boolean;
  canDeafen: boolean;
  muted: boolean;
  deafened: boolean;
  onMove: (channelId: string) => void;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onClose: () => void;
};

export function OccupantMenu({
  x,
  y,
  voiceChannels,
  canMove,
  canMute,
  canDeafen,
  muted,
  deafened,
  onMove,
  onToggleMute,
  onToggleDeafen,
  onClose,
}: OccupantMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [moveOpen, setMoveOpen] = useState(false);
  const [pos, setPos] = useState({ left: x, top: y });

  // Re-clamp on mount and whenever the submenu toggles, since opening it
  // grows the menu height and can push it past the bottom edge.
  useLayoutEffect(() => {
    setPos(clampMenuPosition(x, y, ref.current));
  }, [x, y, moveOpen]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="occupant-menu"
      ref={ref}
      style={{ top: pos.top, left: pos.left }}
    >
      {canMute && (
        <button
          className="occupant-menu-item"
          onClick={() => {
            onToggleMute();
            onClose();
          }}
        >
          {muted ? <Mic size={16} /> : <MicOff size={16} />}
          {muted ? 'Server Unmute' : 'Server Mute'}
        </button>
      )}
      {canDeafen && (
        <button
          className="occupant-menu-item"
          onClick={() => {
            onToggleDeafen();
            onClose();
          }}
        >
          {deafened ? <Headphones size={16} /> : <HeadphoneOff size={16} />}
          {deafened ? 'Server Undeafen' : 'Server Deafen'}
        </button>
      )}
      {canMove && voiceChannels.length > 0 && (
        <>
          <button
            className="occupant-menu-item"
            onClick={() => setMoveOpen((o) => !o)}
          >
            <MoveRight size={16} />
            Move to…
          </button>
          {moveOpen && (
            <div className="occupant-submenu">
              {voiceChannels.map((c) => (
                <button
                  key={c.id}
                  className="occupant-menu-item"
                  onClick={() => {
                    onMove(c.id);
                    onClose();
                  }}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
