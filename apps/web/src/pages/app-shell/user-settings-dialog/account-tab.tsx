import { useState, type FormEvent } from 'react';
import { ApiError } from '../../../lib/api-client';
import { useUpdateMe } from '../../../hooks/users/use-update-me';
import type { PublicUser } from '../../../types/user';

const MIN_PASSWORD = 6;

type AccountTabProps = {
  user: PublicUser;
};

export function AccountTab({ user }: AccountTabProps) {
  const saveName = useUpdateMe();
  const saveUsername = useUpdateMe();
  const savePassword = useUpdateMe();

  const [displayName, setDisplayName] = useState(user.displayName);
  const [username, setUsername] = useState(user.username ?? '');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const nameDirty =
    displayName.trim().length > 0 && displayName.trim() !== user.displayName;
  const usernameDirty =
    username.trim().length > 0 &&
    username.trim().toLowerCase() !== (user.username ?? '');
  const passwordFilled =
    currentPassword.length > 0 &&
    newPassword.length > 0 &&
    confirmPassword.length > 0;

  const onSaveName = (e: FormEvent) => {
    e.preventDefault();
    if (!nameDirty || saveName.isPending) return;
    saveName.mutate({ displayName: displayName.trim() });
  };

  const onSaveUsername = async (e: FormEvent) => {
    e.preventDefault();
    if (!usernameDirty || saveUsername.isPending) return;
    setUsernameError(null);
    try {
      const updated = await saveUsername.mutateAsync({
        username: username.trim(),
      });
      setUsername(updated.username ?? '');
    } catch (err) {
      setUsernameError(
        err instanceof ApiError ? err.message : 'Something went wrong',
      );
    }
  };

  const onSavePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!passwordFilled || savePassword.isPending) return;
    if (newPassword.length < MIN_PASSWORD) {
      setPasswordError(
        `New password must be at least ${MIN_PASSWORD} characters`,
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    setPasswordError(null);
    try {
      await savePassword.mutateAsync({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(
        err instanceof ApiError ? err.message : 'Something went wrong',
      );
    }
  };

  return (
    <div className="user-settings-section">
      <h2 className="user-settings-title">My Account</h2>

      <label className="user-settings-label" htmlFor="us-display-name">
        Display Name
      </label>
      <form className="user-settings-inline" onSubmit={onSaveName}>
        <input
          id="us-display-name"
          className="field-input"
          value={displayName}
          maxLength={40}
          onChange={(e) => setDisplayName(e.target.value)}
        />
        <button
          type="submit"
          className="btn-primary"
          disabled={!nameDirty || saveName.isPending}
        >
          {saveName.isPending ? 'Saving…' : 'Save'}
        </button>
      </form>

      {user.isGuest ? (
        <p className="user-settings-note">
          You’re on a guest account. Guests can’t change their username or
          password — register an account to unlock these settings.
        </p>
      ) : (
        <>
          <label className="user-settings-label" htmlFor="us-username">
            Username
          </label>
          <form className="user-settings-inline" onSubmit={onSaveUsername}>
            <input
              id="us-username"
              className="field-input"
              value={username}
              maxLength={32}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              onChange={(e) => setUsername(e.target.value)}
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={!usernameDirty || saveUsername.isPending}
            >
              {saveUsername.isPending ? 'Saving…' : 'Save'}
            </button>
          </form>
          {usernameError && (
            <span className="field-error">{usernameError}</span>
          )}

          <div className="user-settings-divider" />
          <h3 className="user-settings-subtitle">Change Password</h3>
          <form className="user-settings-password" onSubmit={onSavePassword}>
            <label className="user-settings-label" htmlFor="us-current-pw">
              Current Password
            </label>
            <input
              id="us-current-pw"
              className="field-input"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <label className="user-settings-label" htmlFor="us-new-pw">
              New Password
            </label>
            <input
              id="us-new-pw"
              className="field-input"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <label className="user-settings-label" htmlFor="us-confirm-pw">
              Confirm New Password
            </label>
            <input
              id="us-confirm-pw"
              className="field-input"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {passwordError && (
              <span className="field-error">{passwordError}</span>
            )}
            <div className="user-settings-password-actions">
              <button
                type="submit"
                className="btn-primary"
                disabled={!passwordFilled || savePassword.isPending}
              >
                {savePassword.isPending ? 'Changing…' : 'Change Password'}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
