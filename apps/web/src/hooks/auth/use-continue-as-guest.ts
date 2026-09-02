import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';
import type { PublicUser } from '../../types/user';

export function useContinueAsGuest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (displayName: string) =>
      apiFetch<PublicUser>('/auth/guest', {
        method: 'POST',
        body: JSON.stringify({ displayName }),
      }),
    onSuccess: (user) => qc.setQueryData(['me'], user),
  });
}
