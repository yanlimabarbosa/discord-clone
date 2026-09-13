import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';
import type { Message } from '../../types/message';

export function useDeleteMessage(channelId: string | null) {
  const qc = useQueryClient();
  const key = ['messages', channelId];

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/messages/${id}`, { method: 'DELETE' }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Message[]>(key);
      qc.setQueryData<Message[]>(key, (old = []) =>
        old.filter((m) => m.id !== id),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(key, context.previous);
    },
  });
}
