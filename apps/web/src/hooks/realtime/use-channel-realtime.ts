import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '../../lib/socket';
import type { Message } from '../../types/message';

export function useChannelRealtime(channelId: string | null) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!channelId) return;
    const socket = getSocket();
    socket.emit('channel.join', { channelId });

    const onNew = (message: Message) => {
      if (message.channelId !== channelId) return;
      qc.setQueryData<Message[]>(['messages', channelId], (old = []) =>
        old.some((m) => m.id === message.id) ? old : [...old, message],
      );
    };
    socket.on('message.new', onNew);

    return () => {
      socket.emit('channel.leave', { channelId });
      socket.off('message.new', onNew);
    };
  }, [channelId, qc]);
}
