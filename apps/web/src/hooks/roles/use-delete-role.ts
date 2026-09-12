import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';

export function useDeleteRole(serverId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (roleId: string) =>
      apiFetch(`/roles/${roleId}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles', serverId] });
      qc.invalidateQueries({ queryKey: ['permissions', serverId] });
    },
  });
}
