import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';

type InvitePreview = {
  code: string;
  server: { id: string; name: string };
};

export function useInvitePreview(code: string) {
  return useQuery<InvitePreview>({
    queryKey: ['invite', code],
    queryFn: () => apiFetch<InvitePreview>(`/invites/${code}`),
    retry: false,
  });
}
