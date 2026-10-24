'use client';

import { useState } from 'react';
import { clientApi } from '@/lib/client-api';
import { formatClp, SERVICE_KIND_LABEL, SERVICE_KINDS, type ServiceKind } from '@/lib/labels';

export interface VetService {
  kind: ServiceKind;
  duration_min: number;
  price_clp: number;
  home_visit_fee_clp: number;
  active: boolean;
}

const DEFAULT_DURATION: Record<ServiceKind, number> = {
  general_consult: 45,
  vaccination: 30,
  deworming: 20,
  wellness_check: 40,
};

function initialRows(existing: VetService[]): VetService[] {
  return SERVICE_KINDS.map(
    (kind) =>
      existing.find((s) => s.kind === kind) ?? {
        kind,
        duration_min: DEFAULT_DURATION[kind],
        price_clp: 0,
        home_visit_fee_clp: 0,
        active: false,
      },
  );
}

const inputClass =
  'w-full rounded-lg border border-paw-100 bg-white px-3 py-2 text-base tabular-nums focus:outline-none focus:ring-2 focus:ring-paw-500 disabled:bg-ink/5';

export function ServicesForm({ existing }: { existing: VetService[] }) {
  const [rows, setRows] = useState(() => initialRows(existing));
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const update = (kind: ServiceKind, patch: Partial<VetService>) => {
    setRows((current) => current.map((r) => (r.kind === kind ? { ...r, ...patch } : r)));
    setState('idle');
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const invalid = rows.find((r) => r.active && r.price_clp <= 0);
    if (invalid) {
      setError(`Indica el precio de ${SERVICE_KIND_LABEL[invalid.kind]}.`);
      return setState('error');
    }
    setState('saving');
    const res = await clientApi('/api/vets/me/services', { method: 'PUT', body: JSON.stringify(rows) });
    if (!res.success) {
      setError(res.error ?? 'No se pudo guardar');
      return setState('error');
    }
    setState('saved');
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-3">
      {rows.map((row) => (
        <fieldset
          key={row.kind}
          className={`rounded-xl border bg-white p-5 transition ${row.active ? 'border-paw-500' : 'border-paw-100'}`}
        >
          <legend className="sr-only">{SERVICE_KIND_LABEL[row.kind]}</legend>
          <label className="flex items-center justify-between gap-3">
            <span className="text-base font-semibold text-ink">{SERVICE_KIND_LABEL[row.kind]}</span>
            <input
              type="checkbox"
              checked={row.active}
              onChange={(e) => update(row.kind, { active: e.target.checked })}
              className="h-5 w-5 rounded border-paw-100 text-paw-600 focus:ring-paw-500"
              aria-label={`Ofrecer ${SERVICE_KIND_LABEL[row.kind]}`}
            />
          </label>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <label className="text-xs font-medium text-ink/70">
              Duración (min)
              <input
                type="number" min={15} max={60} step={5} disabled={!row.active}
                value={row.duration_min}
                onChange={(e) => update(row.kind, { duration_min: Number(e.target.value) })}
                className={`mt-1 ${inputClass}`}
              />
            </label>
            <label className="text-xs font-medium text-ink/70">
              Precio (CLP)
              <input
                type="number" min={0} step={500} disabled={!row.active}
                value={row.price_clp}
                onChange={(e) => update(row.kind, { price_clp: Number(e.target.value) })}
                className={`mt-1 ${inputClass}`}
              />
            </label>
            <label className="text-xs font-medium text-ink/70">
              Traslado (CLP)
              <input
                type="number" min={0} step={500} disabled={!row.active}
                value={row.home_visit_fee_clp}
                onChange={(e) => update(row.kind, { home_visit_fee_clp: Number(e.target.value) })}
                className={`mt-1 ${inputClass}`}
              />
            </label>
          </div>
          {row.active && (
            <p className="mt-3 text-sm text-ink/70">
              El tutor verá: <strong className="tabular-nums text-ink">{formatClp(row.price_clp + row.home_visit_fee_clp)}</strong>
            </p>
          )}
        </fieldset>
      ))}
      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={state === 'saving'}
          className="rounded-lg bg-paw-600 px-6 py-3 font-semibold text-white transition hover:bg-paw-700 active:scale-[0.98] disabled:opacity-50"
        >
          {state === 'saving' ? 'Guardando…' : 'Guardar servicios'}
        </button>
        <p aria-live="polite" className="text-sm">
          {state === 'saved' && <span className="text-paw-700">Servicios publicados.</span>}
          {state === 'error' && <span className="text-red-700">{error}</span>}
        </p>
      </div>
    </form>
  );
}
