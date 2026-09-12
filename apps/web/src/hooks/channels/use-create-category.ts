import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';
import type { ChannelCategory } from '../../types/channel-category';

export function useCreateCategory(serverId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      apiFetch<ChannelCategory>(`/servers/${serverId}/categories`, {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['categories', serverId] }),
  });
}
