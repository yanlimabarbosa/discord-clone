import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';

export function useDeleteCategory(serverId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: string) =>
      apiFetch(`/categories/${categoryId}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories', serverId] });
      qc.invalidateQueries({ queryKey: ['channels', serverId] });
    },
  });
}
