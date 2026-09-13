import { useState } from 'react';
import { X } from 'lucide-react';
import { OverviewTab } from './overview-tab';
import { MembersTab } from './members-tab';
import { RolesTab } from './roles-tab';
import { useMyPermissions } from '../../../hooks/roles/use-my-permissions';
import { Permissions, hasPermission } from '../../../lib/permissions';
import { useEscapeKey } from '../../../hooks/use-escape-key';
import type { Server } from '../../../types/server';
import './server-settings.css';

type SettingsTab = 'overview' | 'roles' | 'members';

type ServerSettingsDialogProps = {
  server: Server;
  currentUserId: string;
  onClose: () => void;
  onDeleted: () => void;
};

export function ServerSettingsDialog({
  server,
  currentUserId,
  onClose,
  onDeleted,
}: ServerSettingsDialogProps) {
  useEscapeKey(onClose);
  const { data: perms } = useMyPermissions(server.id);
  const bits = perms?.permissions ?? 0;
  const isOwner = perms?.isOwner ?? false;
  const can = (p: number) => isOwner || hasPermission(bits, p);

  const tabs: { key: SettingsTab; label: string; show: boolean }[] = [
    { key: 'overview', label: 'Overview', show: can(Permissions.MANAGE_SERVER) },
    { key: 'roles', label: 'Roles', show: can(Permissions.MANAGE_ROLES) },
    { key: 'members', label: 'Members', show: true },
  ];
  const visible = tabs.filter((t) => t.show);
  const [tab, setTab] = useState<SettingsTab>(visible[0]?.key ?? 'members');
  const active = visible.some((t) => t.key === tab) ? tab : (visible[0]?.key ?? 'members');

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal settings-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Server settings"
      >
        <div className="settings-header">
          <div className="settings-tabs">
            {visible.map((t) => (
              <button
                key={t.key}
                className={`settings-tab ${active === t.key ? 'settings-tab-active' : ''}`}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            className="settings-close"
            onClick={onClose}
            title="Close"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="settings-body">
          {active === 'overview' && (
            <OverviewTab server={server} isOwner={isOwner} onDeleted={onDeleted} />
          )}
          {active === 'roles' && <RolesTab server={server} />}
          {active === 'members' && (
            <MembersTab
              server={server}
              currentUserId={currentUserId}
              canKick={can(Permissions.KICK_MEMBERS)}
              canBan={can(Permissions.BAN_MEMBERS)}
              canManageRoles={can(Permissions.MANAGE_ROLES)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
