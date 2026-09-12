import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';
import type { DmMessage } from '../../types/dm';

export function useDmMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ['dm-messages', conversationId],
    queryFn: () => apiFetch<DmMessage[]>(`/dms/${conversationId}/messages`),
    enabled: !!conversationId,
  });
}
