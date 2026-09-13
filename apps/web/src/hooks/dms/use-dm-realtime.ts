import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '../../lib/socket';
import type { DmMessage, DmSummary } from '../../types/dm';

export function useDmRealtime(conversationId: string | null) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!conversationId) return;
    const socket = getSocket();
    socket.emit('dm.join', { conversationId });

    const onNew = (message: DmMessage) => {
      if (message.conversationId !== conversationId) return;
      qc.setQueryData<DmMessage[]>(['dm-messages', conversationId], (old = []) =>
        old.some((m) => m.id === message.id) ? old : [...old, message],
      );
      const dms = qc.getQueryData<DmSummary[]>(['dms']);
      const summary = dms?.find((d) => d.id === message.conversationId);
      if (summary) {
        qc.setQueryData<DmSummary[]>(['dms'], (old = []) => [
          { ...summary, lastMessage: message.content },
          ...old.filter((d) => d.id !== message.conversationId),
        ]);
      } else {
        // Conversation not cached yet — refetch to pick it up.
        qc.invalidateQueries({ queryKey: ['dms'] });
      }
    };

    socket.on('dm.new', onNew);

    return () => {
      socket.emit('dm.leave', { conversationId });
      socket.off('dm.new', onNew);
    };
  }, [conversationId, qc]);
}
