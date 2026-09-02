import { useQuery } from '@tanstack/react-query';

export type SpeakingMap = Record<string, boolean>;

export function useSpeaking(): SpeakingMap {
  const { data } = useQuery<SpeakingMap>({
    queryKey: ['speaking'],
    queryFn: async () => ({}),
    enabled: false,
    initialData: {},
    staleTime: Infinity,
    gcTime: Infinity,
  });
  return data ?? {};
}
