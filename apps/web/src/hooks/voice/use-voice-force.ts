import { useQuery } from '@tanstack/react-query';

export type VoiceForce = {
  muted: boolean;
  deafened: boolean;
};

export function useVoiceForce(): VoiceForce {
  const { data } = useQuery<VoiceForce>({
    queryKey: ['voiceForce'],
    queryFn: async () => ({ muted: false, deafened: false }),
    enabled: false,
    initialData: { muted: false, deafened: false },
    staleTime: Infinity,
    gcTime: Infinity,
  });
  return data ?? { muted: false, deafened: false };
}
