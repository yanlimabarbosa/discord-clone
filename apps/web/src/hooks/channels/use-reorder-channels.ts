import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';
import type { Channel } from '../../types/server';

export type ReorderItem = {
  id: string;
  categoryId: string | null;
  position: number;
};

export function useReorderChannels(serverId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: ReorderItem[]) =>
      apiFetch<Channel[]>(`/servers/${serverId}/channels/reorder`, {
        method: 'PATCH',
        body: JSON.stringify({ items }),
      }),
    onMutate: async (items) => {
      // Optimistic: reflect the new order immediately.
      await qc.cancelQueries({ queryKey: ['channels', serverId] });
      const prev = qc.getQueryData<Channel[]>(['channels', serverId]);
      if (prev) {
        const byId = new Map(items.map((i) => [i.id, i]));
        const next = prev
          .map((c) => {
            const move = byId.get(c.id);
            return move
              ? { ...c, categoryId: move.categoryId, position: move.position }
              : c;
          })
          .sort((a, b) => a.position - b.position);
        qc.setQueryData(['channels', serverId], next);
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['channels', serverId], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['channels', serverId] }),
  });
}
