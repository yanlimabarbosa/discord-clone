import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useRoles } from '../../../hooks/roles/use-roles';
import { useCreateRole } from '../../../hooks/roles/use-create-role';
import { RoleEditor } from './role-editor';
import type { Server } from '../../../types/server';

type RolesTabProps = {
  server: Server;
};

export function RolesTab({ server }: RolesTabProps) {
  const { data: roles } = useRoles(server.id);
  const createRole = useCreateRole(server.id);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const list = roles ?? [];
  const selected = list.find((r) => r.id === selectedId) ?? list[0] ?? null;

  return (
    <div className="settings-section">
      <div className="roles-head">
        <h2 className="settings-title">Roles</h2>
        <button
          className="btn-primary"
          onClick={async () => {
            const role = await createRole.mutateAsync({ name: 'new role' });
            setSelectedId(role.id);
          }}
          disabled={createRole.isPending}
        >
          <Plus size={15} /> Create Role
        </button>
      </div>

      {list.length === 0 ? (
        <div className="settings-empty">
          No roles yet. Create one to grant members permissions.
        </div>
      ) : (
        <div className="roles-layout">
          <div className="roles-list">
            {list.map((r) => (
              <button
                key={r.id}
                className={`roles-list-item ${selected?.id === r.id ? 'roles-list-item-active' : ''}`}
                onClick={() => setSelectedId(r.id)}
              >
                <span className="role-dot" style={{ background: r.color }} />
                <span className="role-list-name">{r.name}</span>
                <span className="role-count">{r.assignments.length}</span>
              </button>
            ))}
          </div>
          {selected && (
            <RoleEditor
              key={selected.id}
              role={selected}
              serverId={server.id}
              onDeleted={() => setSelectedId(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}
