import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';

export function useAcceptFriend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (friendshipId: string) =>
      apiFetch(`/friends/requests/${friendshipId}/accept`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['friends'] }),
  });
}
