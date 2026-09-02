import { useEffect } from 'react';
import './profile-card.css';

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
};

export function ProfileCard({ user, onClose }: ProfileCardProps) {
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

  return (
    <div className="profile-overlay" onClick={onClose}>
      <div className="profile-card" onClick={(e) => e.stopPropagation()}>
        <div className="profile-banner" />
        <div className="profile-avatar-wrap">
          {user.avatarUrl ? (
            <img
              className="profile-avatar profile-avatar-img"
              src={user.avatarUrl}
              alt={user.displayName}
            />
          ) : (
            <div className="profile-avatar profile-avatar-initial">
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

          <button className="profile-message-btn" disabled>
            Message (soon)
          </button>
        </div>
      </div>
    </div>
  );
}
