import type { Server } from '../../types/server';

type ServerRailProps = {
  servers: Server[];
  activeServerId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onExplore: () => void;
};

export function ServerRail({
  servers,
  activeServerId,
  onSelect,
  onCreate,
  onExplore,
}: ServerRailProps) {
  return (
    <nav className="server-rail">
      <button className="server-pill server-home" title="Home">
        ◇
      </button>
      <div className="server-divider" />
      {servers.map((server) => (
        <button
          key={server.id}
          className={`server-pill ${server.id === activeServerId ? 'server-pill-active' : ''}`}
          title={server.name}
          onClick={() => onSelect(server.id)}
        >
          {server.name.charAt(0).toUpperCase()}
        </button>
      ))}
      <button className="server-pill server-add" title="Add a server" onClick={onCreate}>
        +
      </button>
      <button
        className="server-pill server-explore"
        title="Explore public servers"
        onClick={onExplore}
      >
        🧭
      </button>
    </nav>
  );
}
