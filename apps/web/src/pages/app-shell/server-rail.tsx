import { Plus, Compass } from 'lucide-react';
import type { Server } from '../../types/server';
import { useUnread } from '../../hooks/unread/use-unread';
import { serverBadge } from '../../lib/unread/server-badge';
import './unread.css';

type ServerRailProps = {
  servers: Server[];
  activeServerId: string | null;
  homeActive: boolean;
  onSelect: (id: string) => void;
  onHome: () => void;
  onCreate: () => void;
  onExplore: () => void;
};

export function ServerRail({
  servers,
  activeServerId,
  homeActive,
  onSelect,
  onHome,
  onCreate,
  onExplore,
}: ServerRailProps) {
  const unread = useUnread();
  return (
    <nav className="server-rail">
      <button
        className={`server-pill server-home ${homeActive ? 'server-pill-active' : ''}`}
        title="Home"
        onClick={onHome}
      >
        ◇
      </button>
      <div className="server-divider" />
      {servers.map((server) => {
        const badge = serverBadge(unread[server.id]);
        const active = !homeActive && server.id === activeServerId;
        return (
          <div key={server.id} className="server-pill-wrap">
            {badge.hasUnread && !active && (
              <span className="server-unread-pip" />
            )}
            <button
              className={`server-pill ${active ? 'server-pill-active' : ''} ${server.iconUrl ? 'server-pill-img' : ''}`}
              title={server.name}
              onClick={() => onSelect(server.id)}
            >
              {server.iconUrl ? (
                <img src={server.iconUrl} alt={server.name} />
              ) : (
                server.name.charAt(0).toUpperCase()
              )}
            </button>
            {badge.mentions > 0 && (
              <span className="server-mention-badge">
                {badge.mentions > 99 ? '99+' : badge.mentions}
              </span>
            )}
          </div>
        );
      })}
      <button className="server-pill server-add" title="Add a server" onClick={onCreate}>
        <Plus size={22} />
      </button>
      <button
        className="server-pill server-explore"
        title="Explore public servers"
        onClick={onExplore}
      >
        <Compass size={22} />
      </button>
    </nav>
  );
}
