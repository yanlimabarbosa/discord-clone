import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';

export function useVoiceToken(channelId: string | null) {
  return useQuery<{ token: string }>({
    queryKey: ['voice-token', channelId],
    queryFn: () =>
      apiFetch<{ token: string }>('/livekit/token', {
        method: 'POST',
        body: JSON.stringify({ channelId }),
      }),
    enabled: !!channelId,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
