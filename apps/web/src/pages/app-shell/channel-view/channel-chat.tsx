import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useMessages } from '../../../hooks/messages/use-messages';
import { useSendMessage } from '../../../hooks/messages/use-send-message';
import { useChannelRealtime } from '../../../hooks/realtime/use-channel-realtime';
import { getSocket } from '../../../lib/socket';
import type { Message } from '../../../types/message';
import { MessageList } from './message-list';
import { MessageComposer } from './message-composer';
import './message-extras.css';

type ChannelChatProps = {
  channelId: string;
  channelName: string;
};

const TYPING_STOP_DELAY = 2500;

export function ChannelChat({ channelId, channelName }: ChannelChatProps) {
  const { data: messages, isLoading } = useMessages(channelId);
  const sendMessage = useSendMessage(channelId);
  useChannelRealtime(channelId);

  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const isTypingRef = useRef(false);
  const stopTimerRef = useRef<number | null>(null);

  // Reset reply state and typing when switching channels.
  useEffect(() => {
    setReplyingTo(null);
    return () => {
      if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current);
      if (isTypingRef.current) {
        getSocket().emit('typing.stop', { channelId });
        isTypingRef.current = false;
      }
    };
  }, [channelId]);

  function stopTyping() {
    if (stopTimerRef.current) {
      window.clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    if (isTypingRef.current) {
      getSocket().emit('typing.stop', { channelId });
      isTypingRef.current = false;
    }
  }

  function handleTyping() {
    const socket = getSocket();
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('typing.start', { channelId });
    }
    if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current);
    stopTimerRef.current = window.setTimeout(stopTyping, TYPING_STOP_DELAY);
  }

  function handleSend(
    content: string,
    attachments: { url: string; type: string }[],
  ) {
    if (attachments.length === 0) {
      sendMessage.mutate({ content, replyToId: replyingTo?.id });
    } else {
      attachments.forEach((a, i) =>
        sendMessage.mutate({
          content: i === 0 ? content : '',
          replyToId: i === 0 ? replyingTo?.id : undefined,
          attachmentUrl: a.url,
          attachmentType: a.type,
        }),
      );
    }
    setReplyingTo(null);
    stopTyping();
  }

  return (
    <>
      <MessageList
        messages={messages ?? []}
        loading={isLoading}
        channelName={channelName}
        channelId={channelId}
        onReply={setReplyingTo}
      />
      {replyingTo && (
        <div className="reply-banner">
          <span>
            Replying to{' '}
            <span className="reply-banner-target">
              {replyingTo.author.displayName}
            </span>
          </span>
          <button
            type="button"
            className="reply-banner-close"
            title="Cancel reply"
            onClick={() => setReplyingTo(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}
      <MessageComposer
        channelName={channelName}
        sending={sendMessage.isPending}
        onSend={handleSend}
        onTyping={handleTyping}
      />
    </>
  );
}
