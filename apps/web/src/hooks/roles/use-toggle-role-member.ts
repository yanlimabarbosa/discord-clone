import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';

export function useToggleRoleMember(serverId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      roleId: string;
      userId: string;
      assigned: boolean;
    }) =>
      apiFetch(`/roles/${args.roleId}/members/${args.userId}`, {
        method: args.assigned ? 'DELETE' : 'POST',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles', serverId] });
      qc.invalidateQueries({ queryKey: ['permissions', serverId] });
    },
  });
}
