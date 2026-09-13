import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { ImagePlus } from 'lucide-react';
import { Avatar } from '../../../components/avatar';
import { Tooltip } from '../../../components/tooltip';
import { toastStore } from '../../../lib/toast-store';
import { useRenameServer } from '../../../hooks/servers/use-rename-server';
import { useUploadServerIcon } from '../../../hooks/servers/use-upload-server-icon';
import { useUpdateServerPrivacy } from '../../../hooks/servers/use-update-server-privacy';
import { useDeleteServer } from '../../../hooks/servers/use-delete-server';
import type { Server } from '../../../types/server';

type OverviewTabProps = {
  server: Server;
  isOwner: boolean;
  onDeleted: () => void;
};

export function OverviewTab({ server, isOwner, onDeleted }: OverviewTabProps) {
  const rename = useRenameServer(server.id);
  const uploadIcon = useUploadServerIcon(server.id);
  const privacy = useUpdateServerPrivacy(server.id);
  const deleteServer = useDeleteServer(server.id);
  const [name, setName] = useState(server.name);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const dirty = name.trim() !== server.name && name.trim().length >= 2;

  const onPickIcon = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadIcon.mutate(file, {
        onSuccess: () => toastStore.success('Server updated'),
      });
    }
    e.target.value = '';
  };

  const onRename = (e: FormEvent) => {
    e.preventDefault();
    if (!dirty || rename.isPending) return;
    rename.mutate(name.trim(), {
      onSuccess: () => toastStore.success('Server updated'),
    });
  };

  return (
    <div className="settings-section">
      <h2 className="settings-title">Server Overview</h2>

      <div className="settings-icon-row">
        <Tooltip label="Upload icon">
          <button
            className="settings-icon-btn"
            onClick={() => fileRef.current?.click()}
            aria-label="Upload icon"
          >
            <Avatar name={server.name} avatarUrl={server.iconUrl} size={80} />
            <span className="settings-icon-overlay">
              <ImagePlus size={20} />
            </span>
          </button>
        </Tooltip>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={onPickIcon}
        />
        <div className="settings-icon-hint">
          <div>Minimum 128×128 recommended.</div>
          {uploadIcon.isPending && <div>Uploading…</div>}
        </div>
      </div>

      <label className="settings-label">Server Name</label>
      <form className="settings-inline" onSubmit={onRename}>
        <input
          className="field-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          type="submit"
          className="btn-primary"
          disabled={!dirty || rename.isPending}
        >
          {rename.isPending ? 'Saving…' : 'Save'}
        </button>
      </form>

      <label className="settings-label">Privacy</label>
      <button
        className="settings-toggle-row"
        aria-busy={privacy.isPending}
        onClick={() =>
          privacy.mutate(!server.isPublic, {
            onSuccess: () => toastStore.success('Server updated'),
          })
        }
        disabled={privacy.isPending}
      >
        <div>
          <div className="settings-toggle-name">
            {server.isPublic ? 'Public server' : 'Invite-only'}
          </div>
          <div className="settings-toggle-desc">
            {server.isPublic
              ? 'Anyone can discover and join from Explore.'
              : 'Only people with an invite can join.'}
          </div>
        </div>
        <span
          className={`settings-switch ${server.isPublic ? 'settings-switch-on' : ''}`}
        >
          <span className="settings-switch-knob" />
        </span>
      </button>

      {isOwner && (
      <div className="settings-danger">
        <label className="settings-label">Danger Zone</label>
        {!confirmingDelete ? (
          <button
            className="btn-danger"
            onClick={() => setConfirmingDelete(true)}
          >
            Delete Server
          </button>
        ) : (
          <div className="settings-confirm">
            <span>Delete “{server.name}”? This can’t be undone.</span>
            <div className="settings-confirm-actions">
              <button
                className="btn-ghost"
                onClick={() => setConfirmingDelete(false)}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                disabled={deleteServer.isPending}
                onClick={async () => {
                  await deleteServer.mutateAsync();
                  toastStore.success('Server deleted');
                  onDeleted();
                }}
              >
                {deleteServer.isPending ? 'Deleting…' : 'Delete Forever'}
              </button>
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
