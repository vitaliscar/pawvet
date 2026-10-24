'use client';

import { createClientPb } from './pocketbase/client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface ClientApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/** Fetch desde Client Components contra la API PAWVET con el JWT de la sesión. */
export async function clientApi<T>(path: string, init?: RequestInit): Promise<ClientApiResult<T>> {
  const token = createClientPb().authStore.token;
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
    const body = (await res.json().catch(() => null)) as ClientApiResult<T> | null;
    if (!res.ok) return { success: false, error: body?.error ?? `Error ${res.status}` };
    return body ?? { success: false, error: 'Respuesta vacía' };
  } catch {
    return { success: false, error: 'Sin conexión con el servidor' };
  }
}
