import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';
import type { WatchSearchResult } from '../../types/watch';

export function useWatchSearch(query: string) {
  return useQuery({
    queryKey: ['watch-search', query],
    queryFn: () =>
      apiFetch<WatchSearchResult[]>(
        `/watch/search?q=${encodeURIComponent(query)}`,
      ),
    enabled: query.trim().length > 1,
    staleTime: 60_000,
  });
}
