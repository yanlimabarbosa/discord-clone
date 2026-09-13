import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';
import type { Channel } from '../../types/server';

export function useDeleteChannel(serverId: string | null) {
  const qc = useQueryClient();
  const key = ['channels', serverId];
  return useMutation({
    mutationFn: (channelId: string) =>
      apiFetch<{ ok: boolean }>(`/channels/${channelId}`, { method: 'DELETE' }),
    onMutate: async (channelId) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Channel[]>(key);
      qc.setQueryData<Channel[]>(key, (old = []) =>
        old.filter((c) => c.id !== channelId),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(key, context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}
