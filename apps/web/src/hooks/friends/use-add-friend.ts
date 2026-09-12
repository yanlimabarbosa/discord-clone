import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';

export function useAddFriend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (username: string) =>
      apiFetch('/friends/requests', {
        method: 'POST',
        body: JSON.stringify({ username }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['friends'] }),
  });
}
