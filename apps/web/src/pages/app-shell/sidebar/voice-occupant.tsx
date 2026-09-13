import { memo } from 'react';
import { MicOff, HeadphoneOff } from 'lucide-react';
import type { Member } from '../../../types/member';
import { useSpeakingFor } from '../../../hooks/realtime/use-speaking';
import { useMuteState } from '../../../hooks/voice/use-mute-state';
import { useDeafenState } from '../../../hooks/voice/use-deafen-state';
import { Avatar } from '../../../components/avatar';

type VoiceOccupantProps = {
  member: Member;
  canMove: boolean;
  canModerate: boolean;
  onDragStartUser: (userId: string) => void;
  onDragEndUser: () => void;
  onOpenMenu: (userId: string, x: number, y: number) => void;
  onOpenProfile: (member: Member) => void;
};

export const VoiceOccupant = memo(function VoiceOccupant({
  member,
  canMove,
  canModerate,
  onDragStartUser,
  onDragEndUser,
  onOpenMenu,
  onOpenProfile,
}: VoiceOccupantProps) {
  const isSpeaking = useSpeakingFor(member.id);
  const muteMap = useMuteState();
  const deafenMap = useDeafenState();

  return (
    <div
      className="voice-occupant"
      draggable={canMove}
      onDragStart={(e) => {
        if (!canMove) return;
        onDragStartUser(member.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onDragEnd={onDragEndUser}
      onContextMenu={(e) => {
        if (!canModerate) return;
        e.preventDefault();
        onOpenMenu(member.id, e.clientX, e.clientY);
      }}
      onClick={() => onOpenProfile(member)}
    >
      <Avatar
        name={member.displayName}
        avatarUrl={member.avatarUrl}
        size={24}
        className={`voice-occupant-avatar ${isSpeaking ? 'avatar-speaking' : ''}`}
      />
      <span className="voice-occupant-name">{member.displayName}</span>
      {deafenMap[member.id] ? (
        <HeadphoneOff size={14} className="voice-occupant-icon" />
      ) : (
        muteMap[member.id] && <MicOff size={14} className="voice-occupant-icon" />
      )}
    </div>
  );
});
