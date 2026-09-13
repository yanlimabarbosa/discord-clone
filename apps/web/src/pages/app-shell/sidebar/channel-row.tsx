import { memo } from 'react';
import { Hash, Volume2, Pencil } from 'lucide-react';
import type { Channel } from '../../../types/server';
import type { Member } from '../../../types/member';
import { Tooltip } from '../../../components/tooltip';
import { VoiceOccupant } from './voice-occupant';

type ChannelRowProps = {
  channel: Channel;
  active: boolean;
  unread: boolean;
  mentions: number;
  occupants: Member[];
  canManageChannels: boolean;
  canMove: boolean;
  canModerate: boolean;
  isDragOver: boolean;
  isDragging: boolean;
  onSelect: (channel: Channel) => void;
  onEdit: (channel: Channel) => void;
  onDragStartChannel: (channelId: string) => void;
  onDragEnd: () => void;
  onDragOverChannel: (e: React.DragEvent, channel: Channel) => void;
  onDropOnChannel: (e: React.DragEvent, channel: Channel) => void;
  onDragStartUser: (userId: string) => void;
  onOpenOccupantMenu: (userId: string, x: number, y: number) => void;
  onOpenProfile: (member: Member) => void;
};

export const ChannelRow = memo(function ChannelRow({
  channel,
  active,
  unread,
  mentions,
  occupants,
  canManageChannels,
  canMove,
  canModerate,
  isDragOver,
  isDragging,
  onSelect,
  onEdit,
  onDragStartChannel,
  onDragEnd,
  onDragOverChannel,
  onDropOnChannel,
  onDragStartUser,
  onOpenOccupantMenu,
  onOpenProfile,
}: ChannelRowProps) {
  const isUnread = unread && !active;
  return (
    <div>
      <div
        className={`channel-item ${active ? 'channel-item-active' : ''} ${isUnread ? 'channel-item-unread' : ''} ${isDragOver ? 'channel-drop-active' : ''} ${isDragging ? 'channel-dragging' : ''}`}
        role="button"
        tabIndex={0}
        aria-current={active}
        aria-label={`${channel.type === 'VOICE' ? 'Voice' : 'Text'} channel ${channel.name}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(channel);
          }
        }}
        draggable={canManageChannels}
        onDragStart={(e) => {
          if (!canManageChannels) return;
          onDragStartChannel(channel.id);
          e.dataTransfer.effectAllowed = 'move';
        }}
        onDragEnd={onDragEnd}
        onDragOver={(e) => onDragOverChannel(e, channel)}
        onDrop={(e) => onDropOnChannel(e, channel)}
        onClick={() => onSelect(channel)}
      >
        {isUnread && <span className="channel-unread-pip" />}
        <span className="channel-icon">
          {channel.icon ? (
            channel.icon
          ) : channel.type === 'VOICE' ? (
            <Volume2 size={18} />
          ) : (
            <Hash size={18} />
          )}
        </span>
        <span className="channel-name">{channel.name}</span>
        {mentions > 0 && (
          <span className="channel-mention-badge">
            {mentions > 99 ? '99+' : mentions}
          </span>
        )}
        {canManageChannels && (
          <Tooltip label="Edit channel">
            <button
              className="channel-edit"
              aria-label={`Edit channel ${channel.name}`}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(channel);
              }}
            >
              <Pencil size={14} />
            </button>
          </Tooltip>
        )}
      </div>
      {occupants.map((m) => (
        <VoiceOccupant
          key={m.id}
          member={m}
          canMove={canMove}
          canModerate={canModerate}
          onDragStartUser={onDragStartUser}
          onDragEndUser={onDragEnd}
          onOpenMenu={onOpenOccupantMenu}
          onOpenProfile={onOpenProfile}
        />
      ))}
    </div>
  );
});
