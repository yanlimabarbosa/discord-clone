import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useUpdateRole } from '../../../hooks/roles/use-update-role';
import { useDeleteRole } from '../../../hooks/roles/use-delete-role';
import { toastStore } from '../../../lib/toast-store';
import { PERMISSION_LIST, hasPermission } from '../../../lib/permissions';
import type { Role } from '../../../types/role';

type RoleEditorProps = {
  role: Role;
  serverId: string;
  onDeleted: () => void;
};

const SWATCHES = [
  '#99aab5',
  '#e91e63',
  '#f1c40f',
  '#2ecc71',
  '#3498db',
  '#9b59b6',
  '#e67e22',
  '#e74c3c',
];

export function RoleEditor({ role, serverId, onDeleted }: RoleEditorProps) {
  const update = useUpdateRole(serverId);
  const del = useDeleteRole(serverId);
  const [name, setName] = useState(role.name);
  const [color, setColor] = useState(role.color);
  const [perms, setPerms] = useState(role.permissions);

  useEffect(() => {
    setName(role.name);
    setColor(role.color);
    setPerms(role.permissions);
  }, [role.id, role.name, role.color, role.permissions]);

  const dirty =
    name.trim() !== role.name ||
    color !== role.color ||
    perms !== role.permissions;

  const togglePerm = (bit: number) =>
    setPerms((p) => (hasPermission(p, bit) ? p & ~bit : p | bit));

  return (
    <div className="role-editor">
      <label className="settings-label">Role Name</label>
      <input
        className="field-input"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <label className="settings-label">Color</label>
      <div className="role-swatches">
        {SWATCHES.map((c) => (
          <button
            key={c}
            className={`role-swatch ${color === c ? 'role-swatch-active' : ''}`}
            style={{ background: c }}
            onClick={() => setColor(c)}
          />
        ))}
      </div>

      <label className="settings-label">Permissions</label>
      <div className="role-perms">
        {PERMISSION_LIST.map((p) => (
          <label key={p.key} className="role-perm-row">
            <div className="role-perm-text">
              <span className="role-perm-name">{p.label}</span>
              <span className="role-perm-desc">{p.description}</span>
            </div>
            <input
              type="checkbox"
              checked={hasPermission(perms, p.bit)}
              onChange={() => togglePerm(p.bit)}
            />
          </label>
        ))}
      </div>

      <div className="role-editor-actions">
        <button
          className="btn-danger"
          onClick={async () => {
            await del.mutateAsync(role.id);
            toastStore.success('Role deleted');
            onDeleted();
          }}
          disabled={del.isPending}
        >
          <Trash2 size={15} /> {del.isPending ? 'Deleting…' : 'Delete'}
        </button>
        <button
          className="btn-primary"
          disabled={!dirty || update.isPending}
          onClick={() =>
            update.mutate({
              roleId: role.id,
              name: name.trim() || role.name,
              color,
              permissions: perms,
            })
          }
        >
          {update.isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
