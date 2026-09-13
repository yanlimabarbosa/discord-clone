import { useEffect, useLayoutEffect, useRef } from 'react';
import type { Message } from '../../../types/message';
import { MessageItem } from './message-item';
import { MessageSkeleton } from './message-skeleton';
import { useTyping } from '../../../hooks/realtime/use-typing';
import './message-extras.css';

type MessageListProps = {
  messages: Message[];
  loading: boolean;
  channelName: string;
  channelId: string;
  onReply: (message: Message) => void;
};

const NEAR_BOTTOM_PX = 120;

function typingText(names: string[]): string {
  if (names.length === 1) return `${names[0]} is typing…`;
  if (names.length === 2) return `${names[0]} and ${names[1]} are typing…`;
  if (names.length === 3)
    return `${names[0]}, ${names[1]} and ${names[2]} are typing…`;
  return 'Several people are typing…';
}

export function MessageList({
  messages,
  loading,
  channelName,
  channelId,
  onReply,
}: MessageListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingNames = useTyping(channelId);

  useLayoutEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [channelId]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const nearBottom =
      list.scrollHeight - list.scrollTop - list.clientHeight < NEAR_BOTTOM_PX;
    if (nearBottom) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const showWelcome = !loading && messages.length === 0;

  return (
    <div className="message-list" ref={listRef}>
      {loading ? (
        <MessageSkeleton />
      ) : (
        <>
          {showWelcome && (
            <div className="message-welcome">
              <div className="content-empty-logo">#</div>
              <h3>Welcome to #{channelName}</h3>
              <p>This is the start of the channel.</p>
            </div>
          )}
          {messages.map((message) => (
            <MessageItem key={message.id} message={message} onReply={onReply} />
          ))}
        </>
      )}
      {typingNames.length > 0 && (
        <div className="typing-indicator">
          <span className="typing-dots">
            <span />
            <span />
            <span />
          </span>
          {typingText(typingNames)}
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
