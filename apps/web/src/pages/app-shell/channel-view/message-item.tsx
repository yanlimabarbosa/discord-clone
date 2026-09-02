import { useState } from 'react';
import type { Message } from '../../../types/message';
import { ProfileCard } from '../profile-card';

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
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div className="message">
      <div
        className="avatar message-avatar"
        style={{ cursor: 'pointer' }}
        onClick={() => setShowProfile(true)}
      >
        {initial}
      </div>
      <div className="message-body">
        <div className="message-meta">
          <span
            className="message-author"
            style={{ cursor: 'pointer' }}
            onClick={() => setShowProfile(true)}
          >
            {message.author.displayName}
          </span>
          <span className="message-time">{time}</span>
        </div>
        <div className="message-content">{message.content}</div>
      </div>
      {showProfile && (
        <ProfileCard
          user={{
            id: message.author.id,
            displayName: message.author.displayName,
            avatarUrl: message.author.avatarUrl,
          }}
          onClose={() => setShowProfile(false)}
        />
      )}
    </div>
  );
}
