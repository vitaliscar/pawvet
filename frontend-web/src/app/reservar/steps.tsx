'use client';

import { useState } from 'react';
import { formatClp, formatDate, SERVICE_KIND_LABEL, type ServiceKind } from '@/lib/labels';
import { BOOKING_TERMS } from '@/lib/pilot';

export interface Pet { id: string; name: string; species: string }
export interface NearbyVet { vet_id: string; full_name: string; clinic_name: string | null; bio: string | null; distance_km: number }
export interface VetService { id: string; kind: ServiceKind; duration_min: number; price_clp: number; home_visit_fee_clp: number | null }

export const totalPrice = (s: VetService) => s.price_clp + (s.home_visit_fee_clp ?? 0);

const choiceClass = (isSelected: boolean) =>
  `w-full rounded-xl border bg-white p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-paw-500 ${
    isSelected ? 'border-paw-600 ring-1 ring-paw-600' : 'border-paw-100 hover:border-paw-500'
  }`;
const SPECIES = [
  { value: 'dog', label: 'Perro' }, { value: 'cat', label: 'Gato' }, { value: 'rabbit', label: 'Conejo' },
  { value: 'bird', label: 'Ave' }, { value: 'other', label: 'Otra' },
];

export function StepTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="font-serif text-3xl leading-tight text-paw-900">{children}</h2>;
}

export function PetStep({ pets, selectedId, onSelect, onCreate }: {
  pets: Pet[]; selectedId: string | null; onSelect: (pet: Pet) => void; onCreate: (name: string, species: string) => Promise<string | null>;
}) {
  const [isAdding, setIsAdding] = useState(pets.length === 0);
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('dog');
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const err = await onCreate(name.trim(), species);
    if (err) return setError(err);
    setIsAdding(false);
    setName('');
  }

  return (
    <div>
      <StepTitle>¿A quién visitamos?</StepTitle>
      <ul className="mt-5 space-y-2">
        {pets.map((pet) => (
          <li key={pet.id}>
            <button type="button" onClick={() => onSelect(pet)} className={choiceClass(pet.id === selectedId)}>
              <span className="text-base font-semibold text-ink">{pet.name}</span>
              <span className="ml-2 text-sm text-ink/60">{SPECIES.find((s) => s.value === pet.species)?.label}</span>
            </button>
          </li>
        ))}
      </ul>
      {isAdding ? (
        <form onSubmit={handleAdd} className="mt-4 space-y-3 rounded-xl border border-dashed border-paw-500 bg-white p-4">
          <label className="block text-sm font-medium text-ink">
            Nombre de tu mascota
            <input required maxLength={100} value={name} onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-paw-100 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-paw-500" />
          </label>
          <label className="block text-sm font-medium text-ink">
            Especie
            <select value={species} onChange={(e) => setSpecies(e.target.value)}
              className="mt-1 w-full rounded-lg border border-paw-100 bg-white px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-paw-500">
              {SPECIES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </label>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <button type="submit" className="rounded-lg bg-paw-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-paw-700">
            Agregar mascota
          </button>
        </form>
      ) : (
        <button type="button" onClick={() => setIsAdding(true)} className="mt-4 text-sm font-semibold text-paw-700 underline">
          + Agregar otra mascota
        </button>
      )}
    </div>
  );
}

export function VetStep({ vets, isLoading, selectedId, onSelect, onUseLocation, locationNote }: {
  vets: NearbyVet[]; isLoading: boolean; selectedId: string | null; onSelect: (vet: NearbyVet) => void;
  onUseLocation: () => void; locationNote: string;
}) {
  return (
    <div>
      <StepTitle>Elige a tu veterinario</StepTitle>
      <p className="mt-2 text-sm text-ink/70">
        {locationNote}{' '}
        <button type="button" onClick={onUseLocation} className="font-semibold text-paw-700 underline">Usar mi ubicación actual</button>
      </p>
      {isLoading && <p className="mt-5 text-sm text-ink/60" aria-live="polite">Buscando veterinarios cercanos…</p>}
      {!isLoading && vets.length === 0 && (
        <p className="mt-5 rounded-xl border border-dashed border-paw-100 bg-white p-5 text-sm text-ink/70">
          Aún no hay veterinarios con horarios en tu zona. Estamos sumando profesionales al piloto.
        </p>
      )}
      <ul className="mt-5 space-y-2">
        {vets.map((vet) => (
          <li key={vet.vet_id}>
            <button type="button" onClick={() => onSelect(vet)} className={choiceClass(vet.vet_id === selectedId)}>
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-base font-semibold text-ink">{vet.full_name}</span>
                <span className="text-sm tabular-nums text-ink/60">{vet.distance_km.toLocaleString('es-CL')} km</span>
              </span>
              <span className="mt-1 inline-block rounded-full bg-paw-50 px-2 py-0.5 text-xs font-semibold text-paw-700">Verificado</span>
              {vet.bio && <span className="mt-2 block text-sm text-ink/70">{vet.bio}</span>}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ServiceStep({ services, selectedId, onSelect }: {
  services: VetService[]; selectedId: string | null; onSelect: (s: VetService) => void;
}) {
  return (
    <div>
      <StepTitle>¿Qué necesita?</StepTitle>
      <ul className="mt-5 space-y-2">
        {services.map((s) => (
          <li key={s.id}>
            <button type="button" onClick={() => onSelect(s)} className={choiceClass(s.id === selectedId)}>
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-base font-semibold text-ink">{SERVICE_KIND_LABEL[s.kind]}</span>
                <span className="text-lg font-bold tabular-nums text-paw-900">{formatClp(totalPrice(s))}</span>
              </span>
              <span className="mt-1 block text-sm text-ink/60">
                {s.duration_min} min · incluye traslado {formatClp(s.home_visit_fee_clp ?? 0)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SlotStep({ dates, date, onDate, slots, isLoading, time, onTime }: {
  dates: string[]; date: string | null; onDate: (d: string) => void; slots: string[];
  isLoading: boolean; time: string | null; onTime: (t: string) => void;
}) {
  return (
    <div>
      <StepTitle>¿Cuándo?</StepTitle>
      <div className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-2" role="listbox" aria-label="Día">
        {dates.map((d) => {
          const [weekday = '', ...rest] = formatDate(d).split(' ');
          return (
            <button key={d} type="button" role="option" aria-selected={d === date} onClick={() => onDate(d)}
              className={`flex min-w-[4.5rem] flex-col items-center rounded-xl border px-3 py-2 transition ${
                d === date ? 'border-paw-600 bg-paw-600 text-white' : 'border-paw-100 bg-white text-ink hover:border-paw-500'
              }`}>
              <span className="text-xs font-medium">{weekday.replace(',', '').slice(0, 3)}</span>
              <span className="text-lg font-bold tabular-nums">{rest[0]}</span>
            </button>
          );
        })}
      </div>
      {date && (
        <div className="mt-4">
          {isLoading && <p className="text-sm text-ink/60" aria-live="polite">Revisando horarios…</p>}
          {!isLoading && slots.length === 0 && <p className="text-sm text-ink/70">No quedan horarios este día. Prueba otro.</p>}
          <div className="grid grid-cols-3 gap-2">
            {slots.map((t) => (
              <button key={t} type="button" onClick={() => onTime(t)}
                className={`rounded-lg border py-3 text-base font-semibold tabular-nums transition ${
                  t === time ? 'border-paw-600 bg-paw-600 text-white' : 'border-paw-100 bg-white text-ink hover:border-paw-500'
                }`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ReviewStep({ rows, total, error }: { rows: [string, string][]; total: number; error: string | null }) {
  return (
    <div>
      <StepTitle>Revisa y confirma</StepTitle>
      <dl className="mt-5 divide-y divide-paw-100 rounded-xl border border-paw-100 bg-white">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 px-4 py-3 text-sm">
            <dt className="text-ink/60">{label}</dt>
            <dd className="text-right font-medium text-ink">{value}</dd>
          </div>
        ))}
        <div className="flex items-baseline justify-between px-4 py-4">
          <dt className="font-semibold text-ink">Total a pagar al veterinario</dt>
          <dd className="text-2xl font-bold tabular-nums text-paw-900">{formatClp(total)}</dd>
        </div>
      </dl>
      <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-ink/70">
        {BOOKING_TERMS.slice(0, 2).map((t) => <li key={t}>{t}</li>)}
      </ul>
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    </div>
  );
}
