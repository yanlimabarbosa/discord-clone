import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '../../lib/api-client';
import type { PublicUser } from '../../types/user';

async function uploadAvatar(file: File): Promise<PublicUser> {
  const form = new FormData();
  form.append('file', file);
  // Use raw fetch here: apiFetch forces a JSON Content-Type, but for multipart
  // uploads the browser must set the Content-Type (with the boundary) itself.
  const res = await fetch('/api/users/me/avatar', {
    method: 'POST',
    credentials: 'include',
    body: form,
  });
  if (!res.ok) {
    const message = await res
      .json()
      .then((body) => body?.message ?? res.statusText)
      .catch(() => res.statusText);
    throw new ApiError(
      res.status,
      Array.isArray(message) ? message[0] : message,
    );
  }
  return res.json() as Promise<PublicUser>;
}

export function useUploadAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (user) => {
      qc.setQueryData(['me'], user);
      qc.invalidateQueries({ queryKey: ['members'] });
    },
  });
}
