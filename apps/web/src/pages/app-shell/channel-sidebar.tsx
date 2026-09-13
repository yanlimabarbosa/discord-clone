import { useCallback, useMemo, useState, type DragEvent } from 'react';
import type { Channel, Server } from '../../types/server';
import type { PublicUser } from '../../types/user';
import type { Member } from '../../types/member';
import type { ActiveVoice } from './use-app-shell';
import { useMembers } from '../../hooks/members/use-members';
import { useUnread } from '../../hooks/unread/use-unread';
import { useCategories } from '../../hooks/channels/use-categories';
import { useCreateCategory } from '../../hooks/channels/use-create-category';
import { useReorderChannels } from '../../hooks/channels/use-reorder-channels';
import { useMyPermissions } from '../../hooks/roles/use-my-permissions';
import { useMoveMember } from '../../hooks/voice/use-move-member';
import { useServerMute } from '../../hooks/voice/use-server-mute';
import { useServerDeafen } from '../../hooks/voice/use-server-deafen';
import { Permissions, hasPermission } from '../../lib/permissions';
import {
  reorderChannels,
  type DropTarget,
} from '../../lib/channels/reorder-channels';
import { CreateChannelDialog } from './create-channel-dialog';
import { EditChannelDialog } from './edit-channel-dialog';
import { CategoryHeader } from './category-header';
import { ProfileCard } from './profile-card';
import { ServerMenu } from './server-menu';
import { ServerSettingsDialog } from './server-settings-dialog';
import { useLeaveServer } from '../../hooks/servers/use-leave-server';
import { VoiceConnectedPanel } from './voice/voice-connected-panel';
import { ChannelRow } from './sidebar/channel-row';
import { UserPanel } from './sidebar/user-panel';
import { OccupantMenuHost } from './sidebar/occupant-menu-host';
import { SkeletonRows } from './skeleton-rows';
import { Tooltip } from '../../components/tooltip';
import { Plus, FolderPlus, ChevronDown } from 'lucide-react';

const NO_OCCUPANTS: Member[] = [];

type ChannelSidebarProps = {
  server: Server | null;
  channels: Channel[];
  loading: boolean;
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
  loading,
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
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [editing, setEditing] = useState<Channel | null>(null);
  const [profile, setProfile] = useState<Member | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { data: members } = useMembers(server?.id ?? null);
  const unread = useUnread();
  const serverUnread = server ? unread[server.id] : undefined;
  const leaveServer = useLeaveServer(server?.id ?? null);
  const { data: categories } = useCategories(server?.id ?? null);
  const createCategory = useCreateCategory(server?.id ?? null);
  const reorder = useReorderChannels(server?.id ?? null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
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
  const canModerate = canMove || canMute || canDeafen;
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

  const cats = useMemo(
    () => [...(categories ?? [])].sort((a, b) => a.position - b.position),
    [categories],
  );

  const channelsByCategory = useMemo(() => {
    const map = new Map<string | null, Channel[]>();
    for (const c of channels) {
      const key = c.categoryId ?? null;
      const list = map.get(key);
      if (list) list.push(c);
      else map.set(key, [c]);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.position - b.position);
    }
    return map;
  }, [channels]);

  const occupantsByChannel = useMemo(() => {
    const map = new Map<string, Member[]>();
    for (const m of members ?? []) {
      if (!m.voiceChannelId) continue;
      const list = map.get(m.voiceChannelId);
      if (list) list.push(m);
      else map.set(m.voiceChannelId, [m]);
    }
    return map;
  }, [members]);

  const voiceChannels = useMemo(
    () => channels.filter((c) => c.type === 'VOICE'),
    [channels],
  );

  const toggleCollapse = useCallback(
    (id: string) =>
      setCollapsed((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      }),
    [],
  );

  const applyDrop = useCallback(
    (target: DropTarget) => {
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
    },
    [draggedId, server, channels, cats, reorder.mutate],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDraggedUserId(null);
    setDragOverKey(null);
  }, []);

  const handleDragStartChannel = useCallback((channelId: string) => {
    setDraggedId(channelId);
  }, []);

  const handleDragStartUser = useCallback((userId: string) => {
    setDraggedUserId(userId);
  }, []);

  const handleDragOverChannel = useCallback(
    (e: DragEvent, channel: Channel) => {
      const userMove = draggedUserId && channel.type === 'VOICE' && canMove;
      const channelReorder =
        canManageChannels && draggedId && draggedId !== channel.id;
      if (!userMove && !channelReorder) return;
      e.preventDefault();
      setDragOverKey(channel.id);
    },
    [draggedUserId, draggedId, canMove, canManageChannels],
  );

  const handleDropOnChannel = useCallback(
    (e: DragEvent, channel: Channel) => {
      e.preventDefault();
      e.stopPropagation();
      if (draggedUserId && channel.type === 'VOICE' && canMove) {
        moveMember.mutate({ userId: draggedUserId, channelId: channel.id });
        setDraggedUserId(null);
        setDragOverKey(null);
        return;
      }
      if (canManageChannels && draggedId) {
        applyDrop({ type: 'channel', channelId: channel.id });
      }
    },
    [draggedUserId, draggedId, canMove, canManageChannels, moveMember.mutate, applyDrop],
  );

  const openOccupantMenu = useCallback((userId: string, x: number, y: number) => {
    setOccupantMenu({ userId, x, y });
  }, []);

  const openProfile = useCallback((member: Member) => setProfile(member), []);
  const openEdit = useCallback((channel: Channel) => setEditing(channel), []);

  const onLeave = async () => {
    await leaveServer.mutateAsync();
    onLeaveServer();
  };

  const renderChannel = (channel: Channel) => {
    const cu = channel.type === 'TEXT' ? serverUnread?.[channel.id] : undefined;
    return (
      <ChannelRow
        key={channel.id}
        channel={channel}
        active={channel.id === activeChannelId}
        unread={!!cu?.unread}
        mentions={cu?.mentions ?? 0}
        occupants={
          channel.type === 'VOICE'
            ? occupantsByChannel.get(channel.id) ?? NO_OCCUPANTS
            : NO_OCCUPANTS
        }
        canManageChannels={canManageChannels}
        canMove={canMove}
        canModerate={canModerate}
        isDragOver={dragOverKey === channel.id}
        isDragging={draggedId === channel.id}
        onSelect={onSelectChannel}
        onEdit={openEdit}
        onDragStartChannel={handleDragStartChannel}
        onDragEnd={handleDragEnd}
        onDragOverChannel={handleDragOverChannel}
        onDropOnChannel={handleDropOnChannel}
        onDragStartUser={handleDragStartUser}
        onOpenOccupantMenu={openOccupantMenu}
        onOpenProfile={openProfile}
      />
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
          <span className="sidebar-header-name">
            {loading ? '' : 'No server'}
          </span>
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
        {loading && <SkeletonRows rows={7} />}
        {!loading && !server && (
          <div className="sidebar-empty">
            Create a server with the <b>+</b> button to get started.
          </div>
        )}
        {!loading && server && (
          <>
            <div className="channel-group-header">
              <span>Channels</span>
              {canManageChannels && (
                <div className="channel-group-actions">
                  <Tooltip label="Create category">
                    <button
                      className="channel-add"
                      aria-label="Create category"
                      onClick={() => setCreatingCategory(true)}
                    >
                      <FolderPlus size={16} />
                    </button>
                  </Tooltip>
                  <Tooltip label="Create channel">
                    <button
                      className="channel-add"
                      aria-label="Create channel"
                      onClick={() => setCreatingChannel(true)}
                    >
                      <Plus size={16} />
                    </button>
                  </Tooltip>
                </div>
              )}
            </div>

            {creatingCategory && (
              <input
                className="channel-inline-input"
                autoFocus
                placeholder="Category name — Enter to create"
                aria-label="New category name"
                onBlur={() => setCreatingCategory(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setCreatingCategory(false);
                    return;
                  }
                  if (e.key === 'Enter') {
                    const name = e.currentTarget.value.trim();
                    if (name) createCategory.mutate(name);
                    setCreatingCategory(false);
                  }
                }}
              />
            )}

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
              {(channelsByCategory.get(null) ?? []).map(renderChannel)}
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
                {!collapsed.has(cat.id) &&
                  (channelsByCategory.get(cat.id) ?? []).map(renderChannel)}
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

      <UserPanel user={user} inVoice={inVoice} onLogout={onLogout} />

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
        <OccupantMenuHost
          userId={occupantMenu.userId}
          x={occupantMenu.x}
          y={occupantMenu.y}
          voiceChannels={voiceChannels}
          canMove={canMove}
          canMute={canMute}
          canDeafen={canDeafen}
          onMove={(userId, channelId) =>
            moveMember.mutate({ userId, channelId })
          }
          onToggleMute={(userId, muted) => serverMute.mutate({ userId, muted })}
          onToggleDeafen={(userId, deafened) =>
            serverDeafen.mutate({ userId, deafened })
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
