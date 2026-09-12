import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Server } from '../../types/server';

export function useUploadServerIcon(serverId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`/api/servers/${serverId}/icon`, {
        method: 'POST',
        credentials: 'include',
        body: form,
      });
      if (!res.ok) throw new Error('upload failed');
      return res.json() as Promise<Server>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['servers'] }),
  });
}
