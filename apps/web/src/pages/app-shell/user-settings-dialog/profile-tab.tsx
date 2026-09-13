import { useRef, type ChangeEvent } from 'react';
import { ImagePlus } from 'lucide-react';
import { Avatar } from '../../../components/avatar';
import { Tooltip } from '../../../components/tooltip';
import { toastStore } from '../../../lib/toast-store';
import { useUploadAvatar } from '../../../hooks/users/use-upload-avatar';
import type { PublicUser } from '../../../types/user';

type ProfileTabProps = {
  user: PublicUser;
};

export function ProfileTab({ user }: ProfileTabProps) {
  const uploadAvatar = useUploadAvatar();
  const fileRef = useRef<HTMLInputElement>(null);

  const onPickAvatar = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadAvatar.mutate(file, {
        onSuccess: () => toastStore.success('Avatar updated'),
      });
    }
    e.target.value = '';
  };

  return (
    <div className="user-settings-section">
      <h2 className="user-settings-title">Profile</h2>

      <label className="user-settings-label">Avatar</label>
      <div className="user-settings-avatar-row">
        <Tooltip label="Upload avatar">
          <button
            className="user-settings-avatar-btn"
            onClick={() => fileRef.current?.click()}
            aria-label="Upload avatar"
            disabled={uploadAvatar.isPending}
          >
            <Avatar
              name={user.displayName}
              avatarUrl={user.avatarUrl}
              size={80}
            />
            <span className="user-settings-avatar-overlay">
              <ImagePlus size={20} />
            </span>
          </button>
        </Tooltip>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={onPickAvatar}
        />
        <div className="user-settings-avatar-hint">
          <div>Minimum 128×128 recommended. Max 3 MB.</div>
          {uploadAvatar.isPending && <div>Uploading…</div>}
        </div>
      </div>
    </div>
  );
}
