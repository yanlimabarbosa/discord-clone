import { useQuery } from '@tanstack/react-query';

export type MuteMap = Record<string, boolean>;

export function useMuteState(): MuteMap {
  const { data } = useQuery<MuteMap>({
    queryKey: ['mute'],
    queryFn: async () => ({}),
    enabled: false,
    initialData: {},
    staleTime: Infinity,
    gcTime: Infinity,
  });
  return data ?? {};
}
