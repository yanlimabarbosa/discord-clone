import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';
import type { Role } from '../../types/role';

export function useUpdateRole(serverId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      roleId: string;
      name?: string;
      color?: string;
      permissions?: number;
    }) =>
      apiFetch<Role>(`/roles/${args.roleId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: args.name,
          color: args.color,
          permissions: args.permissions,
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles', serverId] });
      qc.invalidateQueries({ queryKey: ['permissions', serverId] });
    },
  });
}
