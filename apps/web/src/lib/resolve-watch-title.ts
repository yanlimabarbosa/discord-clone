import { apiFetch } from './api-client';

export async function resolveWatchTitle(id: string): Promise<string> {
  try {
    const { title } = await apiFetch<{ title: string }>(
      `/watch/title?id=${encodeURIComponent(id)}`,
    );
    return title || `Video ${id}`;
  } catch {
    return `Video ${id}`;
  }
}
