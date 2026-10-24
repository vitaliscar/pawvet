'use client';

import { useState } from 'react';
import { clientApi } from '@/lib/client-api';
import { WEEKDAY_LABEL } from '@/lib/labels';

export interface AvailabilityWindow {
  weekday: number;
  start_time: string;
  end_time: string;
}

const SLOT_MINUTES = 60; // Debe coincidir con backend/src/lib/booking.ts
const toMinutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const slotCount = (w: AvailabilityWindow) => Math.max(0, Math.floor((toMinutes(w.end_time) - toMinutes(w.start_time)) / SLOT_MINUTES));

// Lunes primero: es como se lee una semana laboral en Chile.
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

const fieldClass =
  'rounded-lg border border-paw-100 bg-white px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-paw-500';

export function AvailabilityForm({ existing }: { existing: AvailabilityWindow[] }) {
  const [windows, setWindows] = useState<AvailabilityWindow[]>(existing);
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const change = (index: number, patch: Partial<AvailabilityWindow>) => {
    setWindows((ws) => ws.map((w, i) => (i === index ? { ...w, ...patch } : w)));
    setState('idle');
  };
  const add = () => {
    setWindows((ws) => [...ws, { weekday: 1, start_time: '09:00', end_time: '13:00' }]);
    setState('idle');
  };
  const remove = (index: number) => {
    setWindows((ws) => ws.filter((_, i) => i !== index));
    setState('idle');
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (windows.some((w) => slotCount(w) === 0)) {
      setError('Cada ventana debe durar al menos 60 minutos.');
      return setState('error');
    }
    setState('saving');
    const body = windows.map((w) => ({ ...w, service_type: 'home_visit' }));
    const res = await clientApi('/api/vets/me/availability', { method: 'PUT', body: JSON.stringify(body) });
    if (!res.success) {
      setError(res.error ?? 'No se pudo guardar');
      return setState('error');
    }
    setState('saved');
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-3">
      {windows.length === 0 && (
        <p className="rounded-xl border border-dashed border-paw-100 bg-white p-6 text-sm text-ink/70">
          Sin horarios publicados: los tutores no podrán reservarte.
        </p>
      )}
      <ul className="space-y-3">
        {windows.map((w, index) => (
          <li key={index} className="flex flex-wrap items-end gap-3 rounded-xl border border-paw-100 bg-white p-4">
            <label className="text-xs font-medium text-ink/70">
              Día
              <select
                value={w.weekday}
                onChange={(e) => change(index, { weekday: Number(e.target.value) })}
                className={`mt-1 block ${fieldClass}`}
              >
                {WEEKDAY_ORDER.map((d) => (
                  <option key={d} value={d}>{WEEKDAY_LABEL[d]}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-ink/70">
              Desde
              <input type="time" step={1800} value={w.start_time}
                onChange={(e) => change(index, { start_time: e.target.value })}
                className={`mt-1 block ${fieldClass}`} />
            </label>
            <label className="text-xs font-medium text-ink/70">
              Hasta
              <input type="time" step={1800} value={w.end_time}
                onChange={(e) => change(index, { end_time: e.target.value })}
                className={`mt-1 block ${fieldClass}`} />
            </label>
            <span className="pb-2 text-sm tabular-nums text-ink/70">{slotCount(w)} visitas</span>
            <button
              type="button"
              onClick={() => remove(index)}
              className="ml-auto rounded-lg px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
              aria-label={`Quitar horario del ${WEEKDAY_LABEL[w.weekday]}`}
            >
              Quitar
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={add}
        className="rounded-lg border border-paw-500 px-4 py-2 text-sm font-semibold text-paw-700 transition hover:bg-paw-50"
      >
        + Agregar horario
      </button>
      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={state === 'saving'}
          className="rounded-lg bg-paw-600 px-6 py-3 font-semibold text-white transition hover:bg-paw-700 active:scale-[0.98] disabled:opacity-50"
        >
          {state === 'saving' ? 'Guardando…' : 'Guardar disponibilidad'}
        </button>
        <p aria-live="polite" className="text-sm">
          {state === 'saved' && <span className="text-paw-700">Disponibilidad publicada.</span>}
          {state === 'error' && <span className="text-red-700">{error}</span>}
        </p>
      </div>
    </form>
  );
}
