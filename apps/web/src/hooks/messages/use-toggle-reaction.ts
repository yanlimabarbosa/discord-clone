import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';
import type { Message } from '../../types/message';
import type { PublicUser } from '../../types/user';

type ToggleReactionVars = { id: string; emoji: string };

export function useToggleReaction(channelId: string | null) {
  const qc = useQueryClient();
  const key = ['messages', channelId];

  return useMutation({
    mutationFn: ({ id, emoji }: ToggleReactionVars) =>
      apiFetch<Message>(`/messages/${id}/reactions`, {
        method: 'POST',
        body: JSON.stringify({ emoji }),
      }),
    onMutate: async ({ id, emoji }) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Message[]>(key);
      const myId = qc.getQueryData<PublicUser | null>(['me'])?.id;
      if (myId) {
        qc.setQueryData<Message[]>(key, (old = []) =>
          old.map((m) =>
            m.id === id ? { ...m, reactions: toggle(m.reactions, emoji, myId) } : m,
          ),
        );
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(key, context.previous);
    },
    // No invalidation: the socket `message.update` echo patches the cache
    // surgically, so refetching the whole channel history is wasted work.
  });
}

function toggle(
  reactions: Message['reactions'],
  emoji: string,
  myId: string,
): Message['reactions'] {
  const mine = reactions.some((r) => r.emoji === emoji && r.userId === myId);
  if (mine) {
    return reactions.filter((r) => !(r.emoji === emoji && r.userId === myId));
  }
  return [...reactions, { emoji, userId: myId }];
}
