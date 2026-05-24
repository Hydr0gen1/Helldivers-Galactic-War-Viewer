async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Accept': 'application/json' },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export const apiClient = {
  snapshot: () => apiFetch<unknown>('/api/snapshot'),
  recommendation: () => apiFetch<unknown>('/api/recommendation'),
  health: () => apiFetch<unknown>('/api/health'),
};
