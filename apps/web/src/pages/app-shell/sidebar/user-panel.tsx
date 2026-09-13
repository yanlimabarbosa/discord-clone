import { memo, useRef, useState, type ChangeEvent } from 'react';
import { LogOut, Settings } from 'lucide-react';
import type { PublicUser } from '../../../types/user';
import { useUploadAvatar } from '../../../hooks/users/use-upload-avatar';
import { Avatar } from '../../../components/avatar';
import { Tooltip } from '../../../components/tooltip';
import { UserSettingsDialog } from '../user-settings-dialog';
import { PrefVoiceToggles } from './pref-voice-toggles';
import { LiveVoiceToggles } from './live-voice-toggles';
import './sidebar.css';

type UserPanelProps = {
  user: PublicUser | undefined;
  inVoice: boolean;
  onLogout: () => void;
};

export const UserPanel = memo(function UserPanel({
  user,
  inVoice,
  onLogout,
}: UserPanelProps) {
  const uploadAvatar = useUploadAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const onPickAvatar = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAvatar.mutate(file);
    e.target.value = '';
  };

  return (
    <div className="user-panel">
      <Tooltip label="Change avatar">
        <button
          type="button"
          className="avatar-upload-btn"
          aria-label="Change avatar"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadAvatar.isPending}
        >
          <Avatar
            name={user?.displayName ?? '?'}
            avatarUrl={user?.avatarUrl}
            size={32}
          />
        </button>
      </Tooltip>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={onPickAvatar}
      />
      <div className="user-panel-info">
        <span className="user-panel-name">{user?.displayName}</span>
        <span className="user-panel-tag">
          {user?.isGuest ? 'Guest' : (user?.username ?? 'Member')}
        </span>
      </div>
      {inVoice ? (
        <LiveVoiceToggles userId={user?.id} />
      ) : (
        <PrefVoiceToggles />
      )}
      <Tooltip label="User settings">
        <button
          className="icon-btn"
          aria-label="User settings"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings size={16} />
        </button>
      </Tooltip>
      <Tooltip label="Log out">
        <button className="icon-btn" aria-label="Log out" onClick={onLogout}>
          <LogOut size={16} />
        </button>
      </Tooltip>
      {settingsOpen && user && (
        <UserSettingsDialog user={user} onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  );
});
