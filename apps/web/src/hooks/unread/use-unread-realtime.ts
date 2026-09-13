import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '../../lib/socket';
import { apiFetch } from '../../lib/api-client';
import { playMentionSound } from '../../lib/sounds';
import { notify, requestNotificationPermission } from '../../lib/notifications';
import {
  applyActivity,
  isMention,
  type ActivityEvent,
} from '../../lib/unread/apply-activity';
import type { Channel, Server } from '../../types/server';
import type { ServerUnread, UnreadMap } from '../../types/unread';

export function useUnreadRealtime(
  servers: Server[],
  activeChannelId: string | null,
  meId: string | undefined,
) {
  const qc = useQueryClient();
  const serverIds = servers.map((s) => s.id).join(',');

  useEffect(() => {
    if (!serverIds) return;
    const socket = getSocket();
    const ids = serverIds.split(',');
    ids.forEach((id) => socket.emit('server.join', { serverId: id }));
    ids.forEach(async (id) => {
      try {
        const data = await apiFetch<ServerUnread>(`/servers/${id}/unread`);
        qc.setQueryData<UnreadMap>(['unread'], (old = {}) => ({
          ...old,
          [id]: data,
        }));
      } catch {
        /* ignore */
      }
    });
    return () => {
      ids.forEach((id) => socket.emit('server.leave', { serverId: id }));
    };
  }, [serverIds, qc]);

  useEffect(() => {
    const socket = getSocket();
    const onActivity = (e: ActivityEvent) => {
      qc.setQueryData<UnreadMap>(['unread'], (old = {}) =>
        applyActivity(old, e, meId, activeChannelId),
      );
      if (
        e.authorId !== meId &&
        e.channelId !== activeChannelId &&
        isMention(e, meId)
      ) {
        playMentionSound();
        requestNotificationPermission();
        const channels = qc.getQueryData<Channel[]>(['channels', e.serverId]);
        const channel = channels?.find((c) => c.id === e.channelId);
        notify(channel ? `Mentioned in #${channel.name}` : 'You were mentioned');
      }
    };
    socket.on('channel.activity', onActivity);
    return () => {
      socket.off('channel.activity', onActivity);
    };
  }, [qc, activeChannelId, meId]);
}
