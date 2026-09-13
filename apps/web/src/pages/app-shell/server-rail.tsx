import { useState } from 'react';
import { Plus, Compass, Gem } from 'lucide-react';
import type { Server } from '../../types/server';
import { useUnread } from '../../hooks/unread/use-unread';
import { serverBadge } from '../../lib/unread/server-badge';
import { userColor } from '../../lib/user-color';
import { Tooltip } from '../../components/tooltip';
import { SkeletonCircles } from './skeleton-circles';
import './unread.css';

type ServerRailProps = {
  servers: Server[];
  loading: boolean;
  activeServerId: string | null;
  homeActive: boolean;
  onSelect: (id: string) => void;
  onHome: () => void;
  onCreate: () => void;
  onExplore: () => void;
};

export function ServerRail({
  servers,
  loading,
  activeServerId,
  homeActive,
  onSelect,
  onHome,
  onCreate,
  onExplore,
}: ServerRailProps) {
  const unread = useUnread();
  const [brokenIcons, setBrokenIcons] = useState<Record<string, boolean>>({});
  return (
    <nav className="server-rail">
      <Tooltip label="Home" side="right">
        <button
          className={`server-pill server-home ${homeActive ? 'server-pill-active' : ''}`}
          aria-label="Home"
          onClick={onHome}
        >
          <Gem size={22} />
        </button>
      </Tooltip>
      <div className="server-divider" />
      {loading && <SkeletonCircles count={4} size={48} />}
      {!loading &&
        servers.map((server) => {
        const badge = serverBadge(unread[server.id]);
        const active = !homeActive && server.id === activeServerId;
        const showIcon = !!server.iconUrl && !brokenIcons[server.id];
        return (
          <div key={server.id} className="server-pill-wrap">
            {badge.hasUnread && !active && (
              <span className="server-unread-pip" />
            )}
            <Tooltip label={server.name} side="right">
              <button
                className={`server-pill ${active ? 'server-pill-active' : ''} ${showIcon ? 'server-pill-img' : ''}`}
                aria-label={server.name}
                onClick={() => onSelect(server.id)}
                style={
                  showIcon || active
                    ? undefined
                    : { background: userColor(server.name), color: '#fff' }
                }
              >
                {showIcon ? (
                  <img
                    src={server.iconUrl ?? undefined}
                    alt={server.name}
                    onError={() =>
                      setBrokenIcons((b) => ({ ...b, [server.id]: true }))
                    }
                  />
                ) : (
                  server.name.charAt(0).toUpperCase()
                )}
              </button>
            </Tooltip>
            {badge.mentions > 0 && (
              <span className="server-mention-badge">
                {badge.mentions > 99 ? '99+' : badge.mentions}
              </span>
            )}
          </div>
        );
      })}
      <Tooltip label="Add a server" side="right">
        <button
          className="server-pill server-add"
          aria-label="Add a server"
          onClick={onCreate}
        >
          <Plus size={22} />
        </button>
      </Tooltip>
      <Tooltip label="Explore public servers" side="right">
        <button
          className="server-pill server-explore"
          aria-label="Explore public servers"
          onClick={onExplore}
        >
          <Compass size={22} />
        </button>
      </Tooltip>
    </nav>
  );
}
