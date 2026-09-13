import { useMuteState } from '../../../hooks/voice/use-mute-state';
import { useDeafenState } from '../../../hooks/voice/use-deafen-state';
import type { Channel } from '../../../types/server';
import { OccupantMenu } from '../voice/occupant-menu';

type OccupantMenuHostProps = {
  userId: string;
  x: number;
  y: number;
  voiceChannels: Channel[];
  canMove: boolean;
  canMute: boolean;
  canDeafen: boolean;
  onMove: (userId: string, channelId: string) => void;
  onToggleMute: (userId: string, muted: boolean) => void;
  onToggleDeafen: (userId: string, deafened: boolean) => void;
  onClose: () => void;
};

// Reads the mute/deafen maps here (only mounted while a menu is open) so the
// sidebar itself doesn't re-render on every voice state broadcast.
export function OccupantMenuHost({
  userId,
  x,
  y,
  voiceChannels,
  canMove,
  canMute,
  canDeafen,
  onMove,
  onToggleMute,
  onToggleDeafen,
  onClose,
}: OccupantMenuHostProps) {
  const muteMap = useMuteState();
  const deafenMap = useDeafenState();
  const muted = !!muteMap[userId];
  const deafened = !!deafenMap[userId];

  return (
    <OccupantMenu
      x={x}
      y={y}
      voiceChannels={voiceChannels}
      canMove={canMove}
      canMute={canMute}
      canDeafen={canDeafen}
      muted={muted}
      deafened={deafened}
      onMove={(channelId) => onMove(userId, channelId)}
      onToggleMute={() => onToggleMute(userId, !muted)}
      onToggleDeafen={() => onToggleDeafen(userId, !deafened)}
      onClose={onClose}
    />
  );
}
