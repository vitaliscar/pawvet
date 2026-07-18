import { auth } from '@clerk/nextjs/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: { total: number | null; page: number; limit: number };
}

/** Fetch server-side contra la API PAWVET con el JWT de Clerk. */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiResponse<T>> {
  const { getToken } = await auth();
  const token = await getToken();

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
