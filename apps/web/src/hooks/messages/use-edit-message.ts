import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';
import type { Message } from '../../types/message';

export function useEditMessage() {
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      apiFetch<Message>(`/messages/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ content }),
      }),
  });
}
