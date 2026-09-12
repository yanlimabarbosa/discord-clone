import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';
import type { DmMessage } from '../../types/dm';

export function useSendDm(conversationId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      content: string;
      attachmentUrl?: string;
      attachmentType?: string;
    }) =>
      apiFetch<DmMessage>(`/dms/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify(args),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dms'] });
    },
  });
}
