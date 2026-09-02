import { useState } from 'react';
import type { Channel, Server } from '../../types/server';
import type { PublicUser } from '../../types/user';
import { CreateChannelDialog } from './create-channel-dialog';

type ChannelSidebarProps = {
  server: Server | null;
  channels: Channel[];
  activeChannelId: string | null;
  onSelectChannel: (id: string) => void;
  onInvite: () => void;
  user: PublicUser | undefined;
  onLogout: () => void;
};

export function ChannelSidebar({
  server,
  channels,
  activeChannelId,
  onSelectChannel,
  onInvite,
  user,
  onLogout,
}: ChannelSidebarProps) {
  const [creatingChannel, setCreatingChannel] = useState(false);
  const initial = user?.displayName?.charAt(0).toUpperCase() ?? '?';

  return (
    <aside className="channel-sidebar">
      <div className="sidebar-header">
        <span className="sidebar-header-name">{server?.name ?? 'No server'}</span>
        {server && (
          <button className="sidebar-invite" title="Invite people" onClick={onInvite}>
            Invite
          </button>
        )}
      </div>

      <div className="sidebar-body">
        {!server && (
          <div className="sidebar-empty">
            Create a server with the <b>+</b> button to get started.
          </div>
        )}
        {server && (
          <>
            <div className="channel-group-header">
              <span>Channels</span>
              <button
                className="channel-add"
                title="Create channel"
                onClick={() => setCreatingChannel(true)}
              >
                +
              </button>
            </div>
            {channels.map((channel) => (
              <button
                key={channel.id}
                className={`channel-item ${channel.id === activeChannelId ? 'channel-item-active' : ''}`}
                onClick={() => onSelectChannel(channel.id)}
              >
                <span className="channel-icon">
                  {channel.type === 'VOICE' ? '🔊' : '#'}
                </span>
                {channel.name}
              </button>
            ))}
          </>
        )}
      </div>

      <div className="user-panel">
        <div className="avatar">{initial}</div>
        <div className="user-panel-info">
          <span className="user-panel-name">{user?.displayName}</span>
          <span className="user-panel-tag">
            {user?.isGuest ? 'Guest' : (user?.username ?? 'Member')}
          </span>
        </div>
        <button className="icon-btn" title="Log out" onClick={onLogout}>
          ⏻
        </button>
      </div>

      {creatingChannel && server && (
        <CreateChannelDialog
          serverId={server.id}
          onClose={() => setCreatingChannel(false)}
        />
      )}
    </aside>
  );
}
