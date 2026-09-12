import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';
import type { MyPermissions } from '../../types/role';

export function useMyPermissions(serverId: string | null) {
  return useQuery({
    queryKey: ['permissions', serverId],
    queryFn: () =>
      apiFetch<MyPermissions>(`/servers/${serverId}/permissions`),
    enabled: !!serverId,
  });
}
