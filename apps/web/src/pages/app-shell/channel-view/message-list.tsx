import { useEffect, useRef } from 'react';
import type { Message } from '../../../types/message';
import { MessageItem } from './message-item';

type MessageListProps = {
  messages: Message[];
  channelName: string;
};

export function MessageList({ messages, channelName }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

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
        <MessageItem key={message.id} message={message} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
