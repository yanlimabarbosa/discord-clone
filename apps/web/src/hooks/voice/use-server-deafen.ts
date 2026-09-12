import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';

export function useServerDeafen(serverId: string | null) {
  return useMutation({
    mutationFn: (args: { userId: string; deafened: boolean }) =>
      apiFetch(`/servers/${serverId}/voice/deafen`, {
        method: 'POST',
        body: JSON.stringify(args),
      }),
  });
}
