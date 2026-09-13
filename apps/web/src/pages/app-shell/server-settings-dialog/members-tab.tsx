import { useRef, useState } from 'react';
import { UserX, Ban, Shield } from 'lucide-react';
import { Avatar } from '../../../components/avatar';
import { Tooltip } from '../../../components/tooltip';
import { useMembers } from '../../../hooks/members/use-members';
import { useKickMember } from '../../../hooks/servers/use-kick-member';
import { useBanMember } from '../../../hooks/servers/use-ban-member';
import { useRoles } from '../../../hooks/roles/use-roles';
import { useToggleRoleMember } from '../../../hooks/roles/use-toggle-role-member';
import { toastStore } from '../../../lib/toast-store';
import type { Server } from '../../../types/server';
import type { Role } from '../../../types/role';

type MembersTabProps = {
  server: Server;
  currentUserId: string;
  canKick: boolean;
  canBan: boolean;
  canManageRoles: boolean;
};

type ConfirmTarget = { userId: string; action: 'kick' | 'ban' };

export function MembersTab({
  server,
  currentUserId,
  canKick,
  canBan,
  canManageRoles,
}: MembersTabProps) {
  const { data: members, isLoading } = useMembers(server.id);
  const { data: roles } = useRoles(server.id);
  const kick = useKickMember(server.id);
  const ban = useBanMember(server.id);
  const toggleRole = useToggleRoleMember(server.id);
  const [openRolesFor, setOpenRolesFor] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<ConfirmTarget | null>(null);
  const confirmTimer = useRef<number>();
  const list = members ?? [];
  const allRoles = roles ?? [];

  const rolesForUser = (userId: string): Role[] =>
    allRoles.filter((r) => r.assignments.some((a) => a.userId === userId));

  function armConfirm(target: ConfirmTarget) {
    window.clearTimeout(confirmTimer.current);
    setConfirming(target);
    confirmTimer.current = window.setTimeout(() => setConfirming(null), 3000);
  }

  function onKick(userId: string, displayName: string) {
    if (confirming?.userId !== userId || confirming.action !== 'kick') {
      armConfirm({ userId, action: 'kick' });
      return;
    }
    window.clearTimeout(confirmTimer.current);
    setConfirming(null);
    kick.mutate(userId, {
      onSuccess: () => toastStore.success(`Kicked ${displayName}`),
    });
  }

  function onBan(userId: string, displayName: string) {
    if (confirming?.userId !== userId || confirming.action !== 'ban') {
      armConfirm({ userId, action: 'ban' });
      return;
    }
    window.clearTimeout(confirmTimer.current);
    setConfirming(null);
    ban.mutate(userId, {
      onSuccess: () => toastStore.success(`Banned ${displayName}`),
    });
  }

  if (isLoading) {
    return (
      <div className="settings-section">
        <h2 className="settings-title">Members</h2>
        <div className="settings-members" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="settings-member-row settings-member-skeleton">
              <span className="settings-skel settings-skel-avatar" />
              <div className="settings-member-meta">
                <span className="settings-skel settings-skel-line" />
                <span className="settings-skel settings-skel-line short" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="settings-section">
      <h2 className="settings-title">Members — {list.length}</h2>
      <div className="settings-members">
        {list.map((m) => {
          const isOwner = m.id === server.ownerId;
          const isSelf = m.id === currentUserId;
          const memberRoles = rolesForUser(m.id);
          const confirmingKick =
            confirming?.userId === m.id && confirming.action === 'kick';
          const confirmingBan =
            confirming?.userId === m.id && confirming.action === 'ban';
          return (
            <div key={m.id} className="settings-member-row">
              <Avatar name={m.displayName} avatarUrl={m.avatarUrl} size={36} />
              <div className="settings-member-meta">
                <span className="settings-member-name">{m.displayName}</span>
                <div className="member-role-chips">
                  {isOwner && <span className="settings-member-sub">Owner</span>}
                  {memberRoles.map((r) => (
                    <span
                      key={r.id}
                      className="member-role-chip"
                      style={{
                        borderColor: r.color,
                        color: r.color,
                      }}
                    >
                      {r.name}
                    </span>
                  ))}
                  {!isOwner && memberRoles.length === 0 && (
                    <span className="settings-member-sub">
                      {m.online ? 'Online' : 'Offline'}
                    </span>
                  )}
                </div>
              </div>

              <div className="settings-member-actions">
                {canManageRoles && allRoles.length > 0 && (
                  <div className="member-roles-menu-wrap">
                    <Tooltip label="Roles">
                      <button
                        className="friend-icon-btn"
                        aria-label={`Manage roles for ${m.displayName}`}
                        onClick={() =>
                          setOpenRolesFor((o) => (o === m.id ? null : m.id))
                        }
                      >
                        <Shield size={18} />
                      </button>
                    </Tooltip>
                    {openRolesFor === m.id && (
                      <div className="member-roles-menu">
                        {allRoles.map((r) => {
                          const assigned = r.assignments.some(
                            (a) => a.userId === m.id,
                          );
                          return (
                            <label key={r.id} className="member-roles-item">
                              <span
                                className="role-dot"
                                style={{ background: r.color }}
                              />
                              <span className="member-roles-name">{r.name}</span>
                              <input
                                type="checkbox"
                                checked={assigned}
                                disabled={toggleRole.isPending}
                                onChange={() =>
                                  toggleRole.mutate({
                                    roleId: r.id,
                                    userId: m.id,
                                    assigned,
                                  })
                                }
                              />
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                {!isOwner && !isSelf && canKick && (
                  <Tooltip label={confirmingKick ? 'Click again to kick' : 'Kick'}>
                    <button
                      className={`friend-icon-btn ${confirmingKick ? 'settings-confirm-btn' : ''}`}
                      aria-label={
                        confirmingKick
                          ? `Confirm kick ${m.displayName}`
                          : `Kick ${m.displayName}`
                      }
                      onClick={() => onKick(m.id, m.displayName)}
                      disabled={kick.isPending}
                    >
                      {confirmingKick ? 'Confirm?' : <UserX size={18} />}
                    </button>
                  </Tooltip>
                )}
                {!isOwner && !isSelf && canBan && (
                  <Tooltip label={confirmingBan ? 'Click again to ban' : 'Ban'}>
                    <button
                      className={`friend-icon-btn friend-icon-danger ${confirmingBan ? 'settings-confirm-btn' : ''}`}
                      aria-label={
                        confirmingBan
                          ? `Confirm ban ${m.displayName}`
                          : `Ban ${m.displayName}`
                      }
                      onClick={() => onBan(m.id, m.displayName)}
                      disabled={ban.isPending}
                    >
                      {confirmingBan ? 'Confirm?' : <Ban size={18} />}
                    </button>
                  </Tooltip>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
