import { useState } from 'react';
import { X } from 'lucide-react';
import { AccountTab } from './account-tab';
import { ProfileTab } from './profile-tab';
import { useEscapeKey } from '../../../hooks/use-escape-key';
import { Tooltip } from '../../../components/tooltip';
import type { PublicUser } from '../../../types/user';
import './user-settings.css';

type UserSettingsTab = 'account' | 'profile';

type UserSettingsDialogProps = {
  user: PublicUser;
  onClose: () => void;
};

export function UserSettingsDialog({ user, onClose }: UserSettingsDialogProps) {
  useEscapeKey(onClose);
  const [tab, setTab] = useState<UserSettingsTab>('account');

  const tabs: { key: UserSettingsTab; label: string }[] = [
    { key: 'account', label: 'Account' },
    { key: 'profile', label: 'Profile' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal user-settings-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="User settings"
      >
        <div className="user-settings-header">
          <div className="user-settings-tabs">
            {tabs.map((t) => (
              <button
                key={t.key}
                className={`user-settings-tab ${tab === t.key ? 'user-settings-tab-active' : ''}`}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <Tooltip label="Close">
            <button
              className="user-settings-close"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </Tooltip>
        </div>

        <div className="user-settings-body">
          {tab === 'account' && <AccountTab user={user} />}
          {tab === 'profile' && <ProfileTab user={user} />}
        </div>
      </div>
    </div>
  );
}
