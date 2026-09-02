import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';
import type { Member } from '../../types/member';

export function useMembers(serverId: string | null) {
  return useQuery<Member[]>({
    queryKey: ['members', serverId],
    queryFn: () => apiFetch<Member[]>(`/servers/${serverId}/members`),
    enabled: !!serverId,
  });
}
