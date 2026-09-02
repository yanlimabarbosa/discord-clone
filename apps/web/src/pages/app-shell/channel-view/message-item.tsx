import type { Message } from '../../../types/message';

type MessageItemProps = {
  message: Message;
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function MessageItem({ message }: MessageItemProps) {
  const initial = message.author.displayName.charAt(0).toUpperCase();
  const time = formatTime(message.createdAt);

  return (
    <div className="message">
      <div className="avatar message-avatar">{initial}</div>
      <div className="message-body">
        <div className="message-meta">
          <span className="message-author">{message.author.displayName}</span>
          <span className="message-time">{time}</span>
        </div>
        <div className="message-content">{message.content}</div>
      </div>
    </div>
  );
}
