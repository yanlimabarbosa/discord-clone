import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';
import type { Message } from '../../types/message';

export function useSendMessage(channelId: string | null) {
  return useMutation({
    mutationFn: ({
      content,
      replyToId,
      attachmentUrl,
      attachmentType,
    }: {
      content: string;
      replyToId?: string;
      attachmentUrl?: string;
      attachmentType?: string;
    }) =>
      apiFetch<Message>(`/channels/${channelId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          content,
          replyToId,
          attachmentUrl,
          attachmentType,
        }),
      }),
  });
}
