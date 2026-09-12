import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';
import type { ChannelCategory } from '../../types/channel-category';

export function useCategories(serverId: string | null) {
  return useQuery({
    queryKey: ['categories', serverId],
    queryFn: () =>
      apiFetch<ChannelCategory[]>(`/servers/${serverId}/categories`),
    enabled: !!serverId,
  });
}
