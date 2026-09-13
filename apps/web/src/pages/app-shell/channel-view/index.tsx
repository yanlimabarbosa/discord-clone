import { useEffect } from 'react';
import { Hash, Users } from 'lucide-react';
import { Tooltip } from '../../../components/tooltip';
import type { Channel } from '../../../types/server';
import { ChannelChat } from './channel-chat';
import { useMessages } from '../../../hooks/messages/use-messages';
import { useMarkRead } from '../../../hooks/unread/use-mark-read';

type ChannelViewProps = {
  channel: Channel;
  membersOpen: boolean;
  onToggleMembers: () => void;
};

export function ChannelView({
  channel,
  membersOpen,
  onToggleMembers,
}: ChannelViewProps) {
  const markRead = useMarkRead();
  const { data: messages } = useMessages(channel.id);

  useEffect(() => {
    markRead(channel.serverId, channel.id);
  }, [channel.id, channel.serverId, messages?.length, markRead]);

  return (
    <main className="content">
      <header className="content-header">
        <span className="channel-icon">
          {channel.icon ? channel.icon : <Hash size={20} />}
        </span>
        <span className="content-title">{channel.name}</span>
        <Tooltip label="Toggle member list" side="bottom">
          <button
            className={`header-members-btn ${membersOpen ? 'header-btn-active' : ''}`}
            aria-label="Toggle member list"
            onClick={onToggleMembers}
          >
            <Users size={20} />
          </button>
        </Tooltip>
      </header>
      <ChannelChat
        channelId={channel.id}
        channelName={channel.name}
        serverId={channel.serverId}
      />
    </main>
  );
}
