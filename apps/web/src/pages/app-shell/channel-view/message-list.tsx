import { useEffect, useRef } from 'react';
import type { Message } from '../../../types/message';
import { MessageItem } from './message-item';
import { useTyping } from '../../../hooks/realtime/use-typing';
import './message-extras.css';

type MessageListProps = {
  messages: Message[];
  channelName: string;
  channelId: string;
  onReply: (message: Message) => void;
};

function typingText(names: string[]): string {
  if (names.length === 1) return `${names[0]} is typing…`;
  if (names.length === 2) return `${names[0]} and ${names[1]} are typing…`;
  if (names.length === 3)
    return `${names[0]}, ${names[1]} and ${names[2]} are typing…`;
  return 'Several people are typing…';
}

export function MessageList({
  messages,
  channelName,
  channelId,
  onReply,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingNames = useTyping(channelId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return (
    <div className="message-list">
      <div className="message-welcome">
        <div className="content-empty-logo">#</div>
        <h3>Welcome to #{channelName}</h3>
        <p>This is the start of the channel.</p>
      </div>
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} onReply={onReply} />
      ))}
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
