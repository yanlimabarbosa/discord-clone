import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';
import type { Channel } from '../../types/server';

export function useUpdateChannel(serverId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { channelId: string; name?: string; icon?: string }) =>
      apiFetch<Channel>(`/channels/${input.channelId}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: input.name, icon: input.icon }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['channels', serverId] }),
  });
}
