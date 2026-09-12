import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';

export function useMoveMember(serverId: string | null) {
  return useMutation({
    mutationFn: (args: { userId: string; channelId: string }) =>
      apiFetch(`/servers/${serverId}/voice/move`, {
        method: 'POST',
        body: JSON.stringify(args),
      }),
  });
}
