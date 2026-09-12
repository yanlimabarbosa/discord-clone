import { useQuery } from '@tanstack/react-query';

export type DeafenMap = Record<string, boolean>;

export function useDeafenState(): DeafenMap {
  const { data } = useQuery<DeafenMap>({
    queryKey: ['deafen'],
    queryFn: async () => ({}),
    enabled: false,
    initialData: {},
    staleTime: Infinity,
    gcTime: Infinity,
  });
  return data ?? {};
}
