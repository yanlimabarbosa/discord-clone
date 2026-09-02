import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';
import type { Server } from '../../types/server';

export function useJoinInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) =>
      apiFetch<Server>(`/invites/${code}/join`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['servers'] }),
  });
}
