import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '../../lib/socket';
import type { DmMessage } from '../../types/dm';

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
      qc.invalidateQueries({ queryKey: ['dms'] });
    };

    socket.on('dm.new', onNew);

    return () => {
      socket.emit('dm.leave', { conversationId });
      socket.off('dm.new', onNew);
    };
  }, [conversationId, qc]);
}
