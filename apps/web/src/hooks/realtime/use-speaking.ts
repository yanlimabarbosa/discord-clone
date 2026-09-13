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

// Subscribes to a single user's bit so consumers only re-render when it flips.
export function useSpeakingFor(userId: string): boolean {
  const { data } = useQuery<SpeakingMap, Error, boolean>({
    queryKey: ['speaking'],
    queryFn: async () => ({}),
    enabled: false,
    initialData: {},
    staleTime: Infinity,
    gcTime: Infinity,
    select: (m) => !!m?.[userId],
  });
  return data ?? false;
}
