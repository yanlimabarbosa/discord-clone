import type { Channel } from '../../../types/server';
import { ChannelChat } from './channel-chat';

type ChannelViewProps = {
  channel: Channel;
  onToggleMembers: () => void;
};

export function ChannelView({ channel, onToggleMembers }: ChannelViewProps) {
  return (
    <main className="content">
      <header className="content-header">
        <span className="channel-icon">{channel.icon ?? '#'}</span>
        <span className="content-title">{channel.name}</span>
        <button
          className="header-members-btn"
          title="Toggle member list"
          onClick={onToggleMembers}
        >
          👥
        </button>
      </header>
      <ChannelChat channelId={channel.id} channelName={channel.name} />
    </main>
  );
}
