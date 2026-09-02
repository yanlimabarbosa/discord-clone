import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';

export function useDeleteChannel(serverId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (channelId: string) =>
      apiFetch<{ ok: boolean }>(`/channels/${channelId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['channels', serverId] }),
  });
}
