import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';
import type { Server } from '../../types/server';

export function useLeaveServer(serverId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch(`/servers/${serverId}/leave`, { method: 'POST' }),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['servers'] });
      const previous = qc.getQueryData<Server[]>(['servers']);
      qc.setQueryData<Server[]>(['servers'], (old = []) =>
        old.filter((s) => s.id !== serverId),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(['servers'], context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['servers'] }),
  });
}
