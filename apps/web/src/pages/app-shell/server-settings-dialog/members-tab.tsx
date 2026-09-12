import { useState } from 'react';
import { UserX, Ban, Shield } from 'lucide-react';
import { Avatar } from '../../../components/avatar';
import { useMembers } from '../../../hooks/members/use-members';
import { useKickMember } from '../../../hooks/servers/use-kick-member';
import { useBanMember } from '../../../hooks/servers/use-ban-member';
import { useRoles } from '../../../hooks/roles/use-roles';
import { useToggleRoleMember } from '../../../hooks/roles/use-toggle-role-member';
import type { Server } from '../../../types/server';
import type { Role } from '../../../types/role';

type MembersTabProps = {
  server: Server;
  currentUserId: string;
  canKick: boolean;
  canBan: boolean;
  canManageRoles: boolean;
};

export function MembersTab({
  server,
  currentUserId,
  canKick,
  canBan,
  canManageRoles,
}: MembersTabProps) {
  const { data: members } = useMembers(server.id);
  const { data: roles } = useRoles(server.id);
  const kick = useKickMember(server.id);
  const ban = useBanMember(server.id);
  const toggleRole = useToggleRoleMember(server.id);
  const [openRolesFor, setOpenRolesFor] = useState<string | null>(null);
  const list = members ?? [];
  const allRoles = roles ?? [];

  const rolesForUser = (userId: string): Role[] =>
    allRoles.filter((r) => r.assignments.some((a) => a.userId === userId));

  return (
    <div className="settings-section">
      <h2 className="settings-title">Members — {list.length}</h2>
      <div className="settings-members">
        {list.map((m) => {
          const isOwner = m.id === server.ownerId;
          const isSelf = m.id === currentUserId;
          const memberRoles = rolesForUser(m.id);
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
                    <button
                      className="friend-icon-btn"
                      title="Roles"
                      onClick={() =>
                        setOpenRolesFor((o) => (o === m.id ? null : m.id))
                      }
                    >
                      <Shield size={18} />
                    </button>
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
                  <button
                    className="friend-icon-btn"
                    title="Kick"
                    onClick={() => kick.mutate(m.id)}
                    disabled={kick.isPending}
                  >
                    <UserX size={18} />
                  </button>
                )}
                {!isOwner && !isSelf && canBan && (
                  <button
                    className="friend-icon-btn friend-icon-danger"
                    title="Ban"
                    onClick={() => ban.mutate(m.id)}
                    disabled={ban.isPending}
                  >
                    <Ban size={18} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
