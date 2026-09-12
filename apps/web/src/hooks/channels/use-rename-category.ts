import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';
import type { ChannelCategory } from '../../types/channel-category';

export function useRenameCategory(serverId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { categoryId: string; name: string }) =>
      apiFetch<ChannelCategory>(`/categories/${args.categoryId}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: args.name }),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['categories', serverId] }),
  });
}
