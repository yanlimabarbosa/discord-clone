import { useState } from 'react';
import { usePublicServers } from '../../hooks/servers/use-public-servers';
import { useJoinServer } from '../../hooks/servers/use-join-server';
import { useEscapeKey } from '../../hooks/use-escape-key';
import { toastStore } from '../../lib/toast-store';

type ExploreDialogProps = {
  onClose: () => void;
  onJoined: (serverId: string) => void;
};

export function ExploreDialog({ onClose, onJoined }: ExploreDialogProps) {
  const { data: servers, isLoading } = usePublicServers(true);
  const joinServer = useJoinServer();
  const [joiningId, setJoiningId] = useState<string | null>(null);
  useEscapeKey(onClose);

  async function join(id: string, name: string) {
    setJoiningId(id);
    try {
      await joinServer.mutateAsync(id);
      toastStore.success(`Joined ${name}`);
      onJoined(id);
      onClose();
    } finally {
      setJoiningId(null);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal explore-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Explore public servers"
      >
        <h2 className="modal-title">Explore public servers</h2>
        <p className="modal-subtitle">Jump into any public server — no invite needed.</p>

        <div className="explore-list">
          {isLoading && <div className="sidebar-empty">Loading…</div>}
          {!isLoading && (servers ?? []).length === 0 && (
            <div className="sidebar-empty">
              No public servers to join right now.
            </div>
          )}
          {(servers ?? []).map((s) => (
            <div key={s.id} className="explore-row">
              <div className="avatar explore-icon">
                {s.name.charAt(0).toUpperCase()}
              </div>
              <div className="explore-info">
                <span className="explore-name">{s.name}</span>
                <span className="explore-meta">{s.memberCount} members</span>
              </div>
              <button
                className="btn-primary explore-join"
                onClick={() => join(s.id, s.name)}
                disabled={joiningId !== null}
              >
                {joiningId === s.id ? 'Joining…' : 'Join'}
              </button>
            </div>
          ))}
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
