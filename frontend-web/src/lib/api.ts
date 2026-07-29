import { createServerPb } from './pocketbase/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: { total: number | null; page: number; limit: number };
}

/** Fetch server-side contra la API PAWVET con el JWT de sesión de PocketBase. */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiResponse<T>> {
  const pb = await createServerPb();
  const token = pb.authStore.isValid ? pb.authStore.token : null;

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiResponse<T> | null;
    return { success: false, error: body?.error ?? `Error ${res.status}` };
  }
  return (await res.json()) as ApiResponse<T>;
}
