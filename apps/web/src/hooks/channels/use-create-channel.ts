import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';
import type { Channel, ChannelType } from '../../types/server';

export function useCreateChannel(serverId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; type: ChannelType }) =>
      apiFetch<Channel>(`/servers/${serverId}/channels`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['channels', serverId] }),
  });
}
