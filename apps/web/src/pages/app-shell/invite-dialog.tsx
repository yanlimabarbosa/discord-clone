import { useEffect, useState } from 'react';
import { useCreateInvite } from '../../hooks/invites/use-create-invite';
import { useUpdateServerPrivacy } from '../../hooks/servers/use-update-server-privacy';
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
  const { mutate } = createInvite;

  useEffect(() => {
    mutate();
  }, [mutate]);

  const link = createInvite.data
    ? `${window.location.origin}/invite/${createInvite.data.code}`
    : '';

  function copy() {
    navigator.clipboard.writeText(link);
    setCopied(true);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
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
