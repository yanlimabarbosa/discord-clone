import { useQuery } from '@tanstack/react-query';
import type { UnreadMap } from '../../types/unread';

export function useUnread(): UnreadMap {
  const { data } = useQuery<UnreadMap>({
    queryKey: ['unread'],
    queryFn: async () => ({}),
    enabled: false,
    initialData: {},
    staleTime: Infinity,
    gcTime: Infinity,
  });
  return data ?? {};
}
