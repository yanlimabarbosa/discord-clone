import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';
import type { PublicUser } from '../../types/user';

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      username: string;
      password: string;
      displayName: string;
    }) =>
      apiFetch<PublicUser>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: (user) => qc.setQueryData(['me'], user),
  });
}
