import { useEffect, useState } from 'react';
import { userColor } from '../../lib/user-color';
import './profile-card.css';
import './profile-card-extras.css';

export type ProfileCardUser = {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  isGuest?: boolean;
  online?: boolean;
  username?: string | null;
};

type ProfileCardProps = {
  user: ProfileCardUser;
  onClose: () => void;
  onMessage?: (userId: string) => void;
  isSelf?: boolean;
};

export function ProfileCard({
  user,
  onClose,
  onMessage,
  isSelf,
}: ProfileCardProps) {
  const [avatarBroken, setAvatarBroken] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const initial = user.displayName.charAt(0).toUpperCase();
  const secondary = user.username ?? (user.isGuest ? 'Guest' : 'Member');
  const isOnline = !!user.online;
  const color = userColor(user.displayName);
  const showAvatar = !!user.avatarUrl && !avatarBroken;

  return (
    <div className="profile-overlay" onClick={onClose}>
      <div className="profile-card" onClick={(e) => e.stopPropagation()}>
        <div
          className="profile-banner"
          style={{
            background: `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 60%, #000))`,
          }}
        />
        <div className="profile-avatar-wrap">
          {showAvatar ? (
            <img
              className="profile-avatar profile-avatar-img"
              src={user.avatarUrl ?? undefined}
              alt={user.displayName}
              onError={() => setAvatarBroken(true)}
            />
          ) : (
            <div
              className="profile-avatar profile-avatar-initial"
              style={{ background: color }}
            >
              {initial}
            </div>
          )}
        </div>

        <div className="profile-body">
          <div className="profile-name">{user.displayName}</div>
          <div className="profile-secondary">{secondary}</div>

          <div className="profile-status">
            <span
              className={`profile-status-dot ${
                isOnline ? 'profile-status-online' : 'profile-status-off'
              }`}
            />
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {!isSelf && onMessage && (
            <button
              className="profile-message-btn"
              onClick={() => {
                onMessage(user.id);
                onClose();
              }}
            >
              Message
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
