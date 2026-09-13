import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';
import { toastStore } from '../../lib/toast-store';
import type { PublicUser } from '../../types/user';

export type UpdateMeInput = {
  displayName?: string;
  username?: string;
  currentPassword?: string;
  newPassword?: string;
};

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateMeInput) =>
      apiFetch<PublicUser>('/users/me', {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: (user, input) => {
      qc.setQueryData(['me'], user);
      qc.invalidateQueries({ queryKey: ['members'] });
      toastStore.success(
        input.newPassword ? 'Password changed' : 'Profile updated',
      );
    },
  });
}
