import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';
import type { Message } from '../../types/message';

export function useToggleReaction() {
  return useMutation({
    mutationFn: ({ id, emoji }: { id: string; emoji: string }) =>
      apiFetch<Message>(`/messages/${id}/reactions`, {
        method: 'POST',
        body: JSON.stringify({ emoji }),
      }),
  });
}
