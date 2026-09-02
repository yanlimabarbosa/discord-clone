import { useRef, useState, type ChangeEvent } from 'react';
import type { Channel, Server } from '../../types/server';
import type { PublicUser } from '../../types/user';
import type { Member } from '../../types/member';
import type { ActiveVoice } from './use-app-shell';
import { useMembers } from '../../hooks/members/use-members';
import { useSpeaking } from '../../hooks/realtime/use-speaking';
import { useUploadAvatar } from '../../hooks/users/use-upload-avatar';
import { Avatar } from '../../components/avatar';
import { CreateChannelDialog } from './create-channel-dialog';
import { EditChannelDialog } from './edit-channel-dialog';
import { ProfileCard } from './profile-card';
import { VoiceConnectedPanel } from './voice/voice-connected-panel';
import { Hash, Volume2, Plus, Pencil, LogOut } from 'lucide-react';

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
  const [profile, setProfile] = useState<Member | null>(null);
  const { data: members } = useMembers(server?.id ?? null);
  const speaking = useSpeaking();
  const uploadAvatar = useUploadAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const showVoicePanel = !!voice && inVoice;

  const onPickAvatar = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAvatar.mutate(file);
    e.target.value = '';
  };

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
                <Plus size={16} />
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
                    <span className="channel-icon">
                      {channel.icon ? (
                        channel.icon
                      ) : channel.type === 'VOICE' ? (
                        <Volume2 size={18} />
                      ) : (
                        <Hash size={18} />
                      )}
                    </span>
                    <span className="channel-name">{channel.name}</span>
                    <button
                      className="channel-edit"
                      title="Edit channel"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditing(channel);
                      }}
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                  {occupants.map((m) => (
                    <div
                      key={m.id}
                      className="voice-occupant"
                      onClick={() => setProfile(m)}
                    >
                      <Avatar
                        name={m.displayName}
                        avatarUrl={m.avatarUrl}
                        size={24}
                        className={`voice-occupant-avatar ${speaking[m.id] ? 'avatar-speaking' : ''}`}
                      />
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
        <button
          type="button"
          className="avatar-upload-btn"
          title="Change avatar"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadAvatar.isPending}
        >
          <Avatar
            name={user?.displayName ?? '?'}
            avatarUrl={user?.avatarUrl}
            size={32}
          />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={onPickAvatar}
        />
        <div className="user-panel-info">
          <span className="user-panel-name">{user?.displayName}</span>
          <span className="user-panel-tag">
            {user?.isGuest ? 'Guest' : (user?.username ?? 'Member')}
          </span>
        </div>
        <button className="icon-btn" title="Log out" onClick={onLogout}>
          <LogOut size={16} />
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
      {profile && (
        <ProfileCard user={profile} onClose={() => setProfile(null)} />
      )}
    </aside>
  );
}
