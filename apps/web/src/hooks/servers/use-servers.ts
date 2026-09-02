import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';
import type { Server } from '../../types/server';

export function useServers() {
  return useQuery<Server[]>({
    queryKey: ['servers'],
    queryFn: () => apiFetch<Server[]>('/servers'),
  });
}
