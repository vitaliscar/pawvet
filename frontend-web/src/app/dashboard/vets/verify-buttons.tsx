'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export function VerifyButtons({ vetId }: { vetId: string }) {
  const { getToken } = useAuth();
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function verify(approved: boolean) {
    setIsBusy(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/admin/vets/${vetId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ approved }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <button
          onClick={() => verify(true)}
          disabled={isBusy}
          className="rounded-md bg-paw-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-paw-700 disabled:opacity-50"
        >
          Aprobar
        </button>
        <button
          onClick={() => verify(false)}
          disabled={isBusy}
          className="rounded-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
        >
          Rechazar
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
