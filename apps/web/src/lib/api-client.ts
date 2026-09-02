export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    const message = await res
      .json()
      .then((body) => body?.message ?? res.statusText)
      .catch(() => res.statusText);
    throw new ApiError(res.status, Array.isArray(message) ? message[0] : message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
