import { useRef, useState, type ChangeEvent } from 'react';
import type { Channel, Server } from '../../types/server';
import type { PublicUser } from '../../types/user';
import type { Member } from '../../types/member';
import type { ActiveVoice } from './use-app-shell';
import { useMembers } from '../../hooks/members/use-members';
import { useSpeaking } from '../../hooks/realtime/use-speaking';
import { useUnread } from '../../hooks/unread/use-unread';
import { useMuteState } from '../../hooks/voice/use-mute-state';
import { useDeafenState } from '../../hooks/voice/use-deafen-state';
import { useUploadAvatar } from '../../hooks/users/use-upload-avatar';
import { useCategories } from '../../hooks/channels/use-categories';
import { useCreateCategory } from '../../hooks/channels/use-create-category';
import { useReorderChannels } from '../../hooks/channels/use-reorder-channels';
import { useMyPermissions } from '../../hooks/roles/use-my-permissions';
import { useMoveMember } from '../../hooks/voice/use-move-member';
import { useServerMute } from '../../hooks/voice/use-server-mute';
import { useServerDeafen } from '../../hooks/voice/use-server-deafen';
import { OccupantMenu } from './voice/occupant-menu';
import { Permissions, hasPermission } from '../../lib/permissions';
import {
  reorderChannels,
  type DropTarget,
} from '../../lib/channels/reorder-channels';
import { Avatar } from '../../components/avatar';
import { CreateChannelDialog } from './create-channel-dialog';
import { EditChannelDialog } from './edit-channel-dialog';
import { CategoryHeader } from './category-header';
import { ProfileCard } from './profile-card';
import { ServerMenu } from './server-menu';
import { ServerSettingsDialog } from './server-settings-dialog';
import { useLeaveServer } from '../../hooks/servers/use-leave-server';
import { VoiceConnectedPanel } from './voice/voice-connected-panel';
import {
  Hash,
  Volume2,
  Plus,
  FolderPlus,
  Pencil,
  LogOut,
  ChevronDown,
  MicOff,
  HeadphoneOff,
} from 'lucide-react';

type ChannelSidebarProps = {
  server: Server | null;
  channels: Channel[];
  activeChannelId: string | null;
  onSelectChannel: (channel: Channel) => void;
  onInvite: () => void;
  onLeaveServer: () => void;
  onMessageUser: (userId: string) => void;
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
  onLeaveServer,
  onMessageUser,
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { data: members } = useMembers(server?.id ?? null);
  const speaking = useSpeaking();
  const unread = useUnread();
  const serverUnread = server ? unread[server.id] : undefined;
  const muteMap = useMuteState();
  const deafenMap = useDeafenState();
  const uploadAvatar = useUploadAvatar();
  const leaveServer = useLeaveServer(server?.id ?? null);
  const { data: categories } = useCategories(server?.id ?? null);
  const createCategory = useCreateCategory(server?.id ?? null);
  const reorder = useReorderChannels(server?.id ?? null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const showVoicePanel = !!voice && inVoice;
  const { data: myPerms } = useMyPermissions(server?.id ?? null);
  const permBits = myPerms?.permissions ?? 0;
  const permOwner = myPerms?.isOwner ?? false;
  const can = (p: number) => permOwner || hasPermission(permBits, p);
  const canManageChannels = can(Permissions.MANAGE_CHANNELS);
  const canManageSettings = permOwner || permBits > 0;
  const canMove = can(Permissions.MOVE_MEMBERS);
  const canMute = can(Permissions.MUTE_MEMBERS);
  const canDeafen = can(Permissions.DEAFEN_MEMBERS);
  const moveMember = useMoveMember(server?.id ?? null);
  const serverMute = useServerMute(server?.id ?? null);
  const serverDeafen = useServerDeafen(server?.id ?? null);
  const [draggedUserId, setDraggedUserId] = useState<string | null>(null);
  const [occupantMenu, setOccupantMenu] = useState<{
    userId: string;
    x: number;
    y: number;
  } | null>(null);
  const isOwner = !!server && server.ownerId === user?.id;

  const cats = [...(categories ?? [])].sort((a, b) => a.position - b.position);
  const byCategory = (id: string | null) =>
    channels
      .filter((c) => (c.categoryId ?? null) === id)
      .sort((a, b) => a.position - b.position);

  const toggleCollapse = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  function applyDrop(target: DropTarget) {
    if (draggedId && server) {
      const items = reorderChannels(
        channels.map((c) => ({
          id: c.id,
          categoryId: c.categoryId ?? null,
          position: c.position,
        })),
        cats.map((c) => ({ id: c.id, position: c.position })),
        draggedId,
        target,
      );
      if (items.length) reorder.mutate(items);
    }
    setDraggedId(null);
    setDragOverKey(null);
  }

  const onLeave = async () => {
    await leaveServer.mutateAsync();
    onLeaveServer();
  };

  const onPickAvatar = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAvatar.mutate(file);
    e.target.value = '';
  };

  const renderChannel = (channel: Channel) => {
    const occupants =
      channel.type === 'VOICE'
        ? (members ?? []).filter((m) => m.voiceChannelId === channel.id)
        : [];
    const cu =
      channel.type === 'TEXT' ? serverUnread?.[channel.id] : undefined;
    const isUnread = !!cu?.unread && channel.id !== activeChannelId;
    const mentions = cu?.mentions ?? 0;
    return (
      <div key={channel.id}>
        <div
          className={`channel-item ${channel.id === activeChannelId ? 'channel-item-active' : ''} ${isUnread ? 'channel-item-unread' : ''} ${dragOverKey === channel.id ? 'channel-drop-active' : ''} ${draggedId === channel.id ? 'channel-dragging' : ''}`}
          draggable={canManageChannels}
          onDragStart={(e) => {
            if (!canManageChannels) return;
            setDraggedId(channel.id);
            e.dataTransfer.effectAllowed = 'move';
          }}
          onDragEnd={() => {
            setDraggedId(null);
            setDragOverKey(null);
          }}
          onDragOver={(e) => {
            const userMove =
              draggedUserId && channel.type === 'VOICE' && canMove;
            const channelReorder =
              canManageChannels && draggedId && draggedId !== channel.id;
            if (!userMove && !channelReorder) return;
            e.preventDefault();
            setDragOverKey(channel.id);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (draggedUserId && channel.type === 'VOICE' && canMove) {
              moveMember.mutate({
                userId: draggedUserId,
                channelId: channel.id,
              });
              setDraggedUserId(null);
              setDragOverKey(null);
              return;
            }
            if (canManageChannels && draggedId) {
              applyDrop({ type: 'channel', channelId: channel.id });
            }
          }}
          onClick={() => onSelectChannel(channel)}
        >
          {isUnread && <span className="channel-unread-pip" />}
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
          {mentions > 0 && (
            <span className="channel-mention-badge">
              {mentions > 99 ? '99+' : mentions}
            </span>
          )}
          {canManageChannels && (
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
          )}
        </div>
        {occupants.map((m) => (
          <div
            key={m.id}
            className="voice-occupant"
            draggable={canMove}
            onDragStart={(e) => {
              if (!canMove) return;
              setDraggedUserId(m.id);
              e.dataTransfer.effectAllowed = 'move';
            }}
            onDragEnd={() => {
              setDraggedUserId(null);
              setDragOverKey(null);
            }}
            onContextMenu={(e) => {
              if (!canMove && !canMute && !canDeafen) return;
              e.preventDefault();
              setOccupantMenu({ userId: m.id, x: e.clientX, y: e.clientY });
            }}
            onClick={() => setProfile(m)}
          >
            <Avatar
              name={m.displayName}
              avatarUrl={m.avatarUrl}
              size={24}
              className={`voice-occupant-avatar ${speaking[m.id] ? 'avatar-speaking' : ''}`}
            />
            <span className="voice-occupant-name">{m.displayName}</span>
            {deafenMap[m.id] ? (
              <HeadphoneOff size={14} className="voice-occupant-icon" />
            ) : (
              muteMap[m.id] && (
                <MicOff size={14} className="voice-occupant-icon" />
              )
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <aside className="channel-sidebar">
      <div className="sidebar-header sidebar-header-menu">
        {server ? (
          <button
            className="sidebar-header-trigger"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="sidebar-header-name">{server.name}</span>
            <ChevronDown size={18} className="sidebar-header-chevron" />
          </button>
        ) : (
          <span className="sidebar-header-name">No server</span>
        )}
        {menuOpen && server && (
          <ServerMenu
            isOwner={isOwner}
            canManageSettings={canManageSettings}
            onInvite={onInvite}
            onSettings={() => setSettingsOpen(true)}
            onLeave={onLeave}
            onClose={() => setMenuOpen(false)}
          />
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
              {canManageChannels && (
                <div className="channel-group-actions">
                  <button
                    className="channel-add"
                    title="Create category"
                    onClick={() => createCategory.mutate('New Category')}
                  >
                    <FolderPlus size={16} />
                  </button>
                  <button
                    className="channel-add"
                    title="Create channel"
                    onClick={() => setCreatingChannel(true)}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              )}
            </div>

            <div
              className={`channel-drop-zone ${dragOverKey === 'uncat' ? 'channel-drop-active' : ''}`}
              onDragOver={(e) => {
                if (!draggedId || !canManageChannels) return;
                e.preventDefault();
                setDragOverKey('uncat');
              }}
              onDragLeave={() =>
                setDragOverKey((k) => (k === 'uncat' ? null : k))
              }
              onDrop={() =>
                canManageChannels &&
                applyDrop({ type: 'category', categoryId: null })
              }
            >
              {byCategory(null).map(renderChannel)}
            </div>

            {cats.map((cat) => (
              <div key={cat.id} className="category-group">
                <CategoryHeader
                  category={cat}
                  serverId={server.id}
                  canManage={canManageChannels}
                  collapsed={collapsed.has(cat.id)}
                  isDragOver={dragOverKey === cat.id}
                  onToggle={() => toggleCollapse(cat.id)}
                  onDragOver={(e) => {
                    if (!draggedId || !canManageChannels) return;
                    e.preventDefault();
                    setDragOverKey(cat.id);
                  }}
                  onDragLeave={() =>
                    setDragOverKey((k) => (k === cat.id ? null : k))
                  }
                  onDrop={() =>
                    canManageChannels &&
                    applyDrop({ type: 'category', categoryId: cat.id })
                  }
                />
                {!collapsed.has(cat.id) && byCategory(cat.id).map(renderChannel)}
              </div>
            ))}
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
        <ProfileCard
          user={profile}
          isSelf={profile.id === user?.id}
          onMessage={onMessageUser}
          onClose={() => setProfile(null)}
        />
      )}
      {occupantMenu && (
        <OccupantMenu
          x={occupantMenu.x}
          y={occupantMenu.y}
          voiceChannels={channels.filter((c) => c.type === 'VOICE')}
          canMove={canMove}
          canMute={canMute}
          canDeafen={canDeafen}
          muted={!!muteMap[occupantMenu.userId]}
          deafened={!!deafenMap[occupantMenu.userId]}
          onMove={(channelId) =>
            moveMember.mutate({ userId: occupantMenu.userId, channelId })
          }
          onToggleMute={() =>
            serverMute.mutate({
              userId: occupantMenu.userId,
              muted: !muteMap[occupantMenu.userId],
            })
          }
          onToggleDeafen={() =>
            serverDeafen.mutate({
              userId: occupantMenu.userId,
              deafened: !deafenMap[occupantMenu.userId],
            })
          }
          onClose={() => setOccupantMenu(null)}
        />
      )}
      {settingsOpen && server && (
        <ServerSettingsDialog
          server={server}
          currentUserId={user?.id ?? ''}
          onClose={() => setSettingsOpen(false)}
          onDeleted={() => {
            setSettingsOpen(false);
            onLeaveServer();
          }}
        />
      )}
    </aside>
  );
}
