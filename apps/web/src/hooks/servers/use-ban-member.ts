import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';

export function useBanMember(serverId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      apiFetch(`/servers/${serverId}/bans/${userId}`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members', serverId] }),
  });
}
