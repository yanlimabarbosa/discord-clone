import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';
import type { Role } from '../../types/role';

export function useCreateRole(serverId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; color?: string; permissions?: number }) =>
      apiFetch<Role>(`/servers/${serverId}/roles`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles', serverId] }),
  });
}
