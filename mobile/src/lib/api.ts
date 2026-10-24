const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function apiFetch<T>(
  path: string,
  token: string | null,
  init?: RequestInit,
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
    const body = (await res.json().catch(() => null)) as ApiResponse<T> | null;
    if (!res.ok) {
      return { success: false, error: body?.error ?? `Error ${res.status}` };
    }
    return body ?? { success: false, error: 'Respuesta vacía' };
  } catch {
    return { success: false, error: 'Sin conexión con el servidor' };
  }
}

export interface NearbyVet {
  vet_id: string;
  full_name: string;
  clinic_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  offers_home_visits: boolean;
  offers_clinic_visits: boolean;
  distance_km: number;
}
