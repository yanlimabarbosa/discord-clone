import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';
import type { Server } from '../../types/server';

export function useJoinServer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (serverId: string) =>
      apiFetch<Server>(`/servers/${serverId}/join`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['servers'] });
    },
  });
}
