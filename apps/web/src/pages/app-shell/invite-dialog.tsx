import { useEffect, useState } from 'react';
import { useCreateInvite } from '../../hooks/invites/use-create-invite';

type InviteDialogProps = {
  serverId: string;
  onClose: () => void;
};

export function InviteDialog({ serverId, onClose }: InviteDialogProps) {
  const createInvite = useCreateInvite(serverId);
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
        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
