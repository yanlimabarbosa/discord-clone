import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';
import type { Role } from '../../types/role';

export function useRoles(serverId: string | null) {
  return useQuery({
    queryKey: ['roles', serverId],
    queryFn: () => apiFetch<Role[]>(`/servers/${serverId}/roles`),
    enabled: !!serverId,
  });
}
