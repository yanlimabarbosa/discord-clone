import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';
import type { FriendsData } from '../../types/friend';

export function useAcceptFriend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (friendshipId: string) =>
      apiFetch(`/friends/requests/${friendshipId}/accept`, { method: 'POST' }),
    onMutate: async (friendshipId) => {
      await qc.cancelQueries({ queryKey: ['friends'] });
      const previous = qc.getQueryData<FriendsData>(['friends']);
      qc.setQueryData<FriendsData>(['friends'], (old) => {
        if (!old) return old;
        const entry = old.incoming.find((e) => e.friendshipId === friendshipId);
        if (!entry) return old;
        return {
          ...old,
          incoming: old.incoming.filter(
            (e) => e.friendshipId !== friendshipId,
          ),
          friends: [...old.friends, entry],
        };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(['friends'], context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['friends'] }),
  });
}
