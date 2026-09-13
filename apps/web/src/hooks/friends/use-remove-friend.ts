import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';
import type { FriendsData } from '../../types/friend';

export function useRemoveFriend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (friendshipId: string) =>
      apiFetch(`/friends/${friendshipId}`, { method: 'DELETE' }),
    onMutate: async (friendshipId) => {
      await qc.cancelQueries({ queryKey: ['friends'] });
      const previous = qc.getQueryData<FriendsData>(['friends']);
      qc.setQueryData<FriendsData>(['friends'], (old) => {
        if (!old) return old;
        const drop = (entries: FriendsData['friends']) =>
          entries.filter((e) => e.friendshipId !== friendshipId);
        return {
          friends: drop(old.friends),
          incoming: drop(old.incoming),
          outgoing: drop(old.outgoing),
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
