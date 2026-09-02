import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';

export function useDeleteMessage() {
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/messages/${id}`, { method: 'DELETE' }),
  });
}
