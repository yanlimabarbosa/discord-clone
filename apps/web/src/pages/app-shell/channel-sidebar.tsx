import { useState } from 'react';
import type { Channel, Server } from '../../types/server';
import type { PublicUser } from '../../types/user';
import type { ActiveVoice } from './use-app-shell';
import { useMembers } from '../../hooks/members/use-members';
import { CreateChannelDialog } from './create-channel-dialog';
import { EditChannelDialog } from './edit-channel-dialog';
import { VoiceConnectedPanel } from './voice/voice-connected-panel';

type ChannelSidebarProps = {
  server: Server | null;
  channels: Channel[];
  activeChannelId: string | null;
  onSelectChannel: (channel: Channel) => void;
  onInvite: () => void;
  user: PublicUser | undefined;
  onLogout: () => void;
  voice: ActiveVoice | null;
  inVoice: boolean;
  onViewVoice: () => void;
  onLeaveVoice: () => void;
};

function channelGlyph(channel: Channel): string {
  if (channel.icon) return channel.icon;
  return channel.type === 'VOICE' ? '🔊' : '#';
}

export function ChannelSidebar({
  server,
  channels,
  activeChannelId,
  onSelectChannel,
  onInvite,
  user,
  onLogout,
  voice,
  inVoice,
  onViewVoice,
  onLeaveVoice,
}: ChannelSidebarProps) {
  const [creatingChannel, setCreatingChannel] = useState(false);
  const [editing, setEditing] = useState<Channel | null>(null);
  const { data: members } = useMembers(server?.id ?? null);
  const initial = user?.displayName?.charAt(0).toUpperCase() ?? '?';
  const showVoicePanel = !!voice && inVoice && voice.id !== activeChannelId;

  return (
    <aside className="channel-sidebar">
      <div className="sidebar-header">
        <span className="sidebar-header-name">{server?.name ?? 'No server'}</span>
        {server && (
          <button className="sidebar-invite" onClick={onInvite}>
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
            {channels.map((channel) => {
              const occupants =
                channel.type === 'VOICE'
                  ? (members ?? []).filter(
                      (m) => m.voiceChannelId === channel.id,
                    )
                  : [];
              return (
                <div key={channel.id}>
                  <div
                    className={`channel-item ${channel.id === activeChannelId ? 'channel-item-active' : ''}`}
                    onClick={() => onSelectChannel(channel)}
                  >
                    <span className="channel-icon">{channelGlyph(channel)}</span>
                    <span className="channel-name">{channel.name}</span>
                    <button
                      className="channel-edit"
                      title="Edit channel"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditing(channel);
                      }}
                    >
                      ✎
                    </button>
                  </div>
                  {occupants.map((m) => (
                    <div key={m.id} className="voice-occupant">
                      <div className="avatar voice-occupant-avatar">
                        {m.displayName.charAt(0).toUpperCase()}
                      </div>
                      <span className="voice-occupant-name">
                        {m.displayName}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
          </>
        )}
      </div>

      {showVoicePanel && voice && (
        <VoiceConnectedPanel
          voice={voice}
          onView={onViewVoice}
          onLeave={onLeaveVoice}
        />
      )}

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
      {editing && server && (
        <EditChannelDialog
          channel={editing}
          serverId={server.id}
          onClose={() => setEditing(null)}
        />
      )}
    </aside>
  );
}
