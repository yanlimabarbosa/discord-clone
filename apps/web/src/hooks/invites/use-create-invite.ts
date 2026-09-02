import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';

export function useCreateInvite(serverId: string | null) {
  return useMutation({
    mutationFn: () =>
      apiFetch<{ code: string }>(`/servers/${serverId}/invites`, {
        method: 'POST',
        body: JSON.stringify({}),
      }),
  });
}
