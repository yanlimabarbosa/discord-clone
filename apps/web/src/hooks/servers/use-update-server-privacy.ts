import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';
import type { Server } from '../../types/server';

export function useUpdateServerPrivacy(serverId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (isPublic: boolean) =>
      apiFetch<Server>(`/servers/${serverId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isPublic }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['servers'] }),
  });
}
