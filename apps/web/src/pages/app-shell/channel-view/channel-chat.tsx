import { useMessages } from '../../../hooks/messages/use-messages';
import { useSendMessage } from '../../../hooks/messages/use-send-message';
import { useChannelRealtime } from '../../../hooks/realtime/use-channel-realtime';
import { MessageList } from './message-list';
import { MessageComposer } from './message-composer';

type ChannelChatProps = {
  channelId: string;
  channelName: string;
};

export function ChannelChat({ channelId, channelName }: ChannelChatProps) {
  const { data: messages } = useMessages(channelId);
  const sendMessage = useSendMessage(channelId);
  useChannelRealtime(channelId);

  return (
    <>
      <MessageList messages={messages ?? []} channelName={channelName} />
      <MessageComposer
        channelName={channelName}
        onSend={(content) => sendMessage.mutate(content)}
      />
    </>
  );
}
