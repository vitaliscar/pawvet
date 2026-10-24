'use client';

import { useState } from 'react';
import { clientApi } from '@/lib/client-api';

export interface MedicalNotes {
  vet_notes: string | null;
  diagnosis: string | null;
  treatment: string | null;
  medications: string | null;
  follow_up_required: boolean | null;
}

const FIELDS = [
  { key: 'diagnosis', label: 'Diagnóstico' },
  { key: 'treatment', label: 'Tratamiento' },
  { key: 'medications', label: 'Medicamentos y dosis' },
  { key: 'vet_notes', label: 'Observaciones' },
] as const;

type TextKey = (typeof FIELDS)[number]['key'];

export function NotesForm({ appointmentId, initial }: { appointmentId: string; initial: MedicalNotes }) {
  const [values, setValues] = useState<Record<TextKey, string>>({
    diagnosis: initial.diagnosis ?? '',
    treatment: initial.treatment ?? '',
    medications: initial.medications ?? '',
    vet_notes: initial.vet_notes ?? '',
  });
  const [followUp, setFollowUp] = useState(initial.follow_up_required ?? false);
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState('saving');
    const res = await clientApi(`/api/appointments/${appointmentId}/medical-notes`, {
      method: 'PUT',
      body: JSON.stringify({ ...values, follow_up_required: followUp }),
    });
    if (!res.success) {
      setError(res.error ?? 'No se pudo guardar');
      return setState('error');
    }
    setState('saved');
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
      {FIELDS.map((field) => (
        <div key={field.key}>
          <label htmlFor={field.key} className="mb-1 block text-sm font-semibold text-ink">
            {field.label}
          </label>
          <textarea
            id={field.key}
            rows={3}
            maxLength={20000}
            value={values[field.key]}
            onChange={(e) => {
              setValues((v) => ({ ...v, [field.key]: e.target.value }));
              setState('idle');
            }}
            className="w-full rounded-lg border border-paw-100 bg-white px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-paw-500"
          />
        </div>
      ))}
      <label className="flex items-center gap-3 text-sm font-medium text-ink">
        <input
          type="checkbox"
          checked={followUp}
          onChange={(e) => {
            setFollowUp(e.target.checked);
            setState('idle');
          }}
          className="h-5 w-5 rounded border-paw-100 text-paw-600 focus:ring-paw-500"
        />
        Requiere control de seguimiento
      </label>
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={state === 'saving'}
          className="rounded-lg bg-paw-600 px-6 py-3 font-semibold text-white transition hover:bg-paw-700 active:scale-[0.98] disabled:opacity-50"
        >
          {state === 'saving' ? 'Guardando…' : 'Guardar notas'}
        </button>
        <p aria-live="polite" className="text-sm">
          {state === 'saved' && <span className="text-paw-700">Guardado y cifrado.</span>}
          {state === 'error' && <span className="text-red-700">{error}</span>}
        </p>
      </div>
    </form>
  );
}
