import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';
import type { Message } from '../../types/message';

export function useMessages(channelId: string | null) {
  return useQuery<Message[]>({
    queryKey: ['messages', channelId],
    queryFn: () => apiFetch<Message[]>(`/channels/${channelId}/messages`),
    enabled: !!channelId,
  });
}
