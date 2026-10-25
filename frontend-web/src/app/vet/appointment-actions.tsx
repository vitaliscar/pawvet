'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { clientApi } from '@/lib/client-api';
import type { AppointmentStatus } from '@/lib/labels';

type Target = 'confirmed' | 'completed' | 'cancelled';

const PRIMARY: Partial<Record<AppointmentStatus, { to: Target; label: string }>> = {
  pending: { to: 'confirmed', label: 'Confirmar' },
  confirmed: { to: 'completed', label: 'Marcar completada' },
};

/** canAdvance=false (tutor): solo puede cancelar; confirmar/completar es del vet. */
export function AppointmentActions({ id, status, canAdvance = true }: {
  id: string;
  status: AppointmentStatus;
  canAdvance?: boolean;
}) {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (status !== 'pending' && status !== 'confirmed') return null;
  const primary = canAdvance ? PRIMARY[status] : undefined;

  async function update(to: Target) {
    setIsBusy(true);
    setError(null);
    const res = await clientApi(`/api/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(to === 'cancelled' ? { status: to, cancel_reason: reason } : { status: to }),
    });
    setIsBusy(false);
    if (!res.success) return setError(res.error ?? 'No se pudo actualizar');
    setIsCancelling(false);
    router.refresh();
  }

  if (isCancelling) {
    return (
      <div className="mt-4 space-y-2">
        <label htmlFor={`reason-${id}`} className="block text-sm font-medium text-ink">
          Motivo de la cancelación (opcional)
        </label>
        <input
          id={`reason-${id}`}
          value={reason}
          maxLength={500}
          onChange={(e) => setReason(e.target.value)}
          className="w-full rounded-lg border border-paw-100 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-paw-500"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => update('cancelled')}
            disabled={isBusy}
            className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 disabled:opacity-50"
          >
            Cancelar cita
          </button>
          <button
            type="button"
            onClick={() => setIsCancelling(false)}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-ink transition hover:bg-paw-50"
          >
            Volver
          </button>
        </div>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        {primary && (
          <button
            type="button"
            onClick={() => update(primary.to)}
            disabled={isBusy}
            className="rounded-lg bg-paw-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-paw-700 active:scale-[0.98] disabled:opacity-50"
          >
            {isBusy ? 'Guardando…' : primary.label}
          </button>
        )}
        <button
          type="button"
          onClick={() => setIsCancelling(true)}
          disabled={isBusy}
          className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
