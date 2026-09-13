import { useEffect, useRef, useState } from 'react';
import { useCreateInvite } from '../../hooks/invites/use-create-invite';
import { useUpdateServerPrivacy } from '../../hooks/servers/use-update-server-privacy';
import { useEscapeKey } from '../../hooks/use-escape-key';
import { toastStore } from '../../lib/toast-store';
import type { Server } from '../../types/server';

type InviteDialogProps = {
  server: Server;
  isOwner: boolean;
  onClose: () => void;
};

export function InviteDialog({ server, isOwner, onClose }: InviteDialogProps) {
  const createInvite = useCreateInvite(server.id);
  const updatePrivacy = useUpdateServerPrivacy(server.id);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<number>();
  useEscapeKey(onClose);
  const { mutate } = createInvite;

  useEffect(() => {
    mutate();
  }, [mutate]);

  useEffect(() => () => window.clearTimeout(copyTimer.current), []);

  const link = createInvite.data
    ? `${window.location.origin}/invite/${createInvite.data.code}`
    : '';

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toastStore.success('Invite link copied');
      window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toastStore.error('Could not copy the link — copy it manually');
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Invite people"
      >
        <h2 className="modal-title">Invite people</h2>
        <p className="modal-subtitle">
          Share this link. Anyone can join — even as a guest.
        </p>
        <div className="invite-row">
          <input
            className="field-input invite-link"
            readOnly
            value={link || 'Generating…'}
          />
          <button
            className="btn-primary invite-copy"
            onClick={copy}
            disabled={!link}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        {isOwner && (
          <div className="privacy-row">
            <div className="privacy-info">
              <span className="privacy-title">
                {server.isPublic ? 'Public server' : 'Private server'}
              </span>
              <span className="privacy-desc">
                {server.isPublic
                  ? 'Anyone can find and join this server.'
                  : 'Only people with an invite can join.'}
              </span>
            </div>
            <button
              className="btn-ghost privacy-toggle"
              disabled={updatePrivacy.isPending}
              onClick={() => updatePrivacy.mutate(!server.isPublic)}
            >
              {server.isPublic ? 'Make private' : 'Make public'}
            </button>
          </div>
        )}

        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
