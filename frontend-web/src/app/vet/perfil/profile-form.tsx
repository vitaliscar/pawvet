'use client';

import { useState } from 'react';
import { clientApi } from '@/lib/client-api';
import { PILOT_COMMUNES } from '@/lib/pilot';

export interface VetProfile {
  clinic_address: string | null;
  clinic_lat: number | null;
  clinic_lon: number | null;
  bio: string | null;
  phone: string | null;
}

const fieldClass =
  'mt-1 w-full rounded-lg border border-paw-100 bg-white px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-paw-500';

/** Comuna del piloto cuyo centro coincide con la ubicación guardada (si alguna). */
const communeOf = (p: VetProfile) =>
  PILOT_COMMUNES.find((c) => c.lat === p.clinic_lat && c.lon === p.clinic_lon)?.name ?? '';

export function ProfileForm({ initial }: { initial: VetProfile }) {
  const [commune, setCommune] = useState(communeOf(initial));
  const [address, setAddress] = useState(initial.clinic_address ?? '');
  const [bio, setBio] = useState(initial.bio ?? '');
  const [phone, setPhone] = useState(initial.phone ?? '');
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const hasLocation = initial.clinic_lat != null || commune !== '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const center = PILOT_COMMUNES.find((c) => c.name === commune);
    if (!center) {
      setError('Elige la comuna desde donde atiendes.');
      return setState('error');
    }
    setState('saving');
    const res = await clientApi('/api/vets/me', {
      method: 'PATCH',
      body: JSON.stringify({ clinic_address: address, clinic_lat: center.lat, clinic_lon: center.lon, bio, phone }),
    });
    if (!res.success) {
      setError(res.error ?? 'No se pudo guardar');
      return setState('error');
    }
    setState('saved');
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      {!hasLocation && (
        <p className="rounded-lg bg-clay/15 p-4 text-sm font-medium text-[#9a3f1f]">
          Sin comuna base, los tutores no te encuentran en la búsqueda.
        </p>
      )}
      <fieldset>
        <legend className="text-sm font-semibold text-ink">Comuna base de tus visitas</legend>
        <div className="mt-1 grid grid-cols-2 gap-2">
          {PILOT_COMMUNES.map((c) => (
            <label key={c.name}
              className={`cursor-pointer rounded-lg border px-3 py-2.5 text-center text-sm font-semibold transition ${
                commune === c.name ? 'border-paw-600 bg-paw-50 text-paw-700' : 'border-paw-100 bg-white text-ink'
              }`}>
              <input type="radio" name="commune" value={c.name} checked={commune === c.name}
                onChange={() => { setCommune(c.name); setState('idle'); }} className="sr-only" />
              {c.name}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block text-sm font-semibold text-ink">
        Dirección de referencia (no se muestra a tutores)
        <input maxLength={300} value={address} onChange={(e) => { setAddress(e.target.value); setState('idle'); }} className={fieldClass} />
      </label>
      <label className="block text-sm font-semibold text-ink">
        Presentación para tutores
        <textarea rows={4} maxLength={2000} value={bio} onChange={(e) => { setBio(e.target.value); setState('idle'); }}
          placeholder="Especialidad, años de experiencia y qué incluye tu visita." className={fieldClass} />
      </label>
      <label className="block text-sm font-semibold text-ink">
        Teléfono de contacto (solo PAWVET)
        <input type="tel" maxLength={20} autoComplete="tel" value={phone} onChange={(e) => { setPhone(e.target.value); setState('idle'); }} className={fieldClass} />
      </label>
      <div className="flex items-center gap-4 pt-2">
        <button type="submit" disabled={state === 'saving'}
          className="rounded-lg bg-paw-600 px-6 py-3 font-semibold text-white transition hover:bg-paw-700 active:scale-[0.98] disabled:opacity-50">
          {state === 'saving' ? 'Guardando…' : 'Guardar perfil'}
        </button>
        <p aria-live="polite" className="text-sm">
          {state === 'saved' && <span className="text-paw-700">Perfil actualizado.</span>}
          {state === 'error' && <span className="text-red-700">{error}</span>}
        </p>
      </div>
    </form>
  );
}
