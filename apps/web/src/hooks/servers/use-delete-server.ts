import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';

export function useDeleteServer(serverId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch(`/servers/${serverId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['servers'] }),
  });
}
