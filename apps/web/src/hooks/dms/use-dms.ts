import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';
import type { DmSummary } from '../../types/dm';

export function useDms() {
  return useQuery({
    queryKey: ['dms'],
    queryFn: () => apiFetch<DmSummary[]>('/dms'),
  });
}
