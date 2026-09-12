import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';
import type { FriendsData } from '../../types/friend';

export function useFriends() {
  return useQuery({
    queryKey: ['friends'],
    queryFn: () => apiFetch<FriendsData>('/friends'),
  });
}
