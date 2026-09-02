import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';

export type PublicServer = {
  id: string;
  name: string;
  iconUrl: string | null;
  ownerId: string;
  isPublic: boolean;
  memberCount: number;
};

export function usePublicServers(enabled: boolean) {
  return useQuery<PublicServer[]>({
    queryKey: ['servers', 'public'],
    queryFn: () => apiFetch<PublicServer[]>('/servers/public'),
    enabled,
  });
}
