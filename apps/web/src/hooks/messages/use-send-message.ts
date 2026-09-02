import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';
import type { Message } from '../../types/message';

export function useSendMessage(channelId: string | null) {
  return useMutation({
    mutationFn: (content: string) =>
      apiFetch<Message>(`/channels/${channelId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
  });
}
