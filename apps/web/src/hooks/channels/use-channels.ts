import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';
import type { Channel } from '../../types/server';

export function useChannels(serverId: string | null) {
  return useQuery<Channel[]>({
    queryKey: ['channels', serverId],
    queryFn: () => apiFetch<Channel[]>(`/servers/${serverId}/channels`),
    enabled: !!serverId,
  });
}
