import { useQuery } from '@tanstack/react-query';
import { apiFetch, ApiError } from '../../lib/api-client';
import type { PublicUser } from '../../types/user';

export function useMe() {
  return useQuery<PublicUser | null>({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        return await apiFetch<PublicUser>('/auth/me');
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) return null;
        throw err;
      }
    },
    staleTime: 60 * 1000,
    retry: false,
  });
}
