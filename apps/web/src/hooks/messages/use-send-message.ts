import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';
import type { Message } from '../../types/message';
import type { PublicUser } from '../../types/user';

type SendMessageVars = {
  content: string;
  replyToId?: string;
  attachmentUrl?: string;
  attachmentType?: string;
};

export function useSendMessage(channelId: string | null) {
  const qc = useQueryClient();
  const key = ['messages', channelId];

  return useMutation({
    mutationFn: (vars: SendMessageVars) =>
      apiFetch<Message>(`/channels/${channelId}/messages`, {
        method: 'POST',
        body: JSON.stringify(vars),
      }),
    onMutate: async (vars) => {
      if (!channelId) return {};
      await qc.cancelQueries({ queryKey: key });
      const me = qc.getQueryData<PublicUser | null>(['me']);
      if (!me) return {};
      const tempId = `temp-${crypto.randomUUID?.() ?? Math.random()}`;
      const optimistic: Message = {
        id: tempId,
        channelId,
        content: vars.content,
        createdAt: new Date().toISOString(),
        editedAt: null,
        attachmentUrl: vars.attachmentUrl ?? null,
        attachmentType: vars.attachmentType ?? null,
        author: {
          id: me.id,
          displayName: me.displayName,
          avatarUrl: me.avatarUrl,
        },
        reactions: [],
        replyTo: null,
        pending: true,
      };
      qc.setQueryData<Message[]>(key, (old = []) => [...old, optimistic]);
      return { tempId };
    },
    onSuccess: (real, _vars, context) => {
      qc.setQueryData<Message[]>(key, (old = []) => {
        const withoutTemp = old.filter((m) => m.id !== context?.tempId);
        return withoutTemp.some((m) => m.id === real.id)
          ? withoutTemp
          : [...withoutTemp, real];
      });
    },
    onError: (_err, _vars, context) => {
      if (context?.tempId) {
        qc.setQueryData<Message[]>(key, (old = []) =>
          old.filter((m) => m.id !== context.tempId),
        );
      }
    },
  });
}
