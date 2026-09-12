import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';
import type { UnreadMap } from '../../types/unread';

export function useMarkRead() {
  const qc = useQueryClient();

  return useCallback(
    (serverId: string | null, channelId: string) => {
      qc.setQueryData<UnreadMap>(['unread'], (old = {}) => {
        if (!serverId || !old[serverId]?.[channelId]) return old;
        return {
          ...old,
          [serverId]: {
            ...old[serverId],
            [channelId]: { unread: false, mentions: 0 },
          },
        };
      });
      apiFetch(`/channels/${channelId}/read`, { method: 'POST' }).catch(() => {
        /* best-effort */
      });
    },
    [qc],
  );
}
