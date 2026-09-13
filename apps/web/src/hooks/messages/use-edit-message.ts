import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';
import type { Message } from '../../types/message';

export function useEditMessage(channelId: string | null) {
  const qc = useQueryClient();
  const key = ['messages', channelId];

  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      apiFetch<Message>(`/messages/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ content }),
      }),
    onMutate: async ({ id, content }) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Message[]>(key);
      qc.setQueryData<Message[]>(key, (old = []) =>
        old.map((m) =>
          m.id === id
            ? { ...m, content, editedAt: new Date().toISOString() }
            : m,
        ),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(key, context.previous);
    },
  });
}
