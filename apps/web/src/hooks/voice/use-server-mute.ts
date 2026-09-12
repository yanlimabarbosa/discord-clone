import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';

export function useServerMute(serverId: string | null) {
  return useMutation({
    mutationFn: (args: { userId: string; muted: boolean }) =>
      apiFetch(`/servers/${serverId}/voice/mute`, {
        method: 'POST',
        body: JSON.stringify(args),
      }),
  });
}
