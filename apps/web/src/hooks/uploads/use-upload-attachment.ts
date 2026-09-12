import { ApiError } from '../../lib/api-client';

export type UploadedAttachment = { url: string; type: string };

export async function uploadAttachment(
  file: File,
): Promise<UploadedAttachment> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/uploads', {
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
  return res.json() as Promise<UploadedAttachment>;
}
