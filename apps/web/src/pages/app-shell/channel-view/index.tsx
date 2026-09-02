import { useMessages } from '../../../hooks/messages/use-messages';
import { useSendMessage } from '../../../hooks/messages/use-send-message';
import { useChannelRealtime } from '../../../hooks/realtime/use-channel-realtime';
import type { Channel } from '../../../types/server';
import { MessageList } from './message-list';
import { MessageComposer } from './message-composer';

type ChannelViewProps = {
  channel: Channel | null;
};

export function ChannelView({ channel }: ChannelViewProps) {
  const channelId = channel?.id ?? null;
  const { data: messages } = useMessages(channelId);
  const sendMessage = useSendMessage(channelId);
  useChannelRealtime(channelId);

  if (!channel) {
    return (
      <main className="content">
        <div className="content-empty">
          <div className="content-empty-logo">◇</div>
          <h2>No channel selected</h2>
          <p>Pick a text channel on the left, or create a server to start.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="content">
      <header className="content-header">
        <span className="channel-icon">#</span>
        <span className="content-title">{channel.name}</span>
      </header>
      <MessageList messages={messages ?? []} channelName={channel.name} />
      <MessageComposer
        channelName={channel.name}
        onSend={(content) => sendMessage.mutate(content)}
      />
    </main>
  );
}
