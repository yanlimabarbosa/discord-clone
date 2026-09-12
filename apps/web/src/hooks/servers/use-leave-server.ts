import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';

export function useLeaveServer(serverId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch(`/servers/${serverId}/leave`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['servers'] }),
  });
}
