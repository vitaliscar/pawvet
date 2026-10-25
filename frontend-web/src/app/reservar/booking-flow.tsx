'use client';

import Link from 'next/link';
import { useState } from 'react';
import { clientApi } from '@/lib/client-api';
import { formatClp, formatDate, SERVICE_KIND_LABEL } from '@/lib/labels';
import { SEARCH_RADIUS_KM } from '@/lib/pilot';
import {
  PetStep, ReviewStep, ServiceStep, SlotStep, StepTitle, totalPrice, VetStep,
  type NearbyVet, type Pet, type VetService,
} from './steps';

export interface Owner { full_name: string; address: string | null; lat: number | null; lon: number | null }

type Step = 'pet' | 'vet' | 'service' | 'slot' | 'review' | 'done';
const STEPS: { key: Step; label: string }[] = [
  { key: 'pet', label: 'Mascota' }, { key: 'vet', label: 'Veterinario' }, { key: 'service', label: 'Servicio' },
  { key: 'slot', label: 'Horario' }, { key: 'review', label: 'Confirmar' },
];
const DAYS_AHEAD = 14;

/** Próximos días calendario desde hoy en Chile, como YYYY-MM-DD. */
function upcomingDates(): string[] {
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Santiago' }).format(new Date());
  const base = new Date(`${today}T12:00:00Z`).getTime();
  return Array.from({ length: DAYS_AHEAD }, (_, i) => new Date(base + i * 86_400_000).toISOString().slice(0, 10));
}

export function BookingFlow({ owner, initialPets }: { owner: Owner; initialPets: Pet[] }) {
  const [step, setStep] = useState<Step>('pet');
  const [pets, setPets] = useState(initialPets);
  const [pet, setPet] = useState<Pet | null>(null);
  const [coords, setCoords] = useState({ lat: owner.lat, lon: owner.lon });
  // La distancia inicial se mide desde el centro de la comuna, no desde la dirección exacta.
  const [locationNote, setLocationNote] = useState('Distancias aproximadas desde el centro de tu comuna.');
  const [vets, setVets] = useState<NearbyVet[]>([]);
  const [vet, setVet] = useState<NearbyVet | null>(null);
  const [services, setServices] = useState<VetService[]>([]);
  const [service, setService] = useState<VetService | null>(null);
  const [dates] = useState(upcomingDates);
  const [date, setDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [time, setTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function searchVets(lat: number | null, lon: number | null) {
    if (lat == null || lon == null) return setError('Completa tu dirección para buscar veterinarios.');
    setIsLoading(true);
    const res = await clientApi<NearbyVet[]>(
      `/api/search/vets?lat=${lat}&lon=${lon}&radius_km=${SEARCH_RADIUS_KM}&service=home_visit`,
    );
    setIsLoading(false);
    setVets(res.data ?? []);
    if (!res.success) setError(res.error ?? 'No pudimos buscar veterinarios.');
  }

  async function createPet(name: string, species: string): Promise<string | null> {
    const res = await clientApi<Pet>('/api/pets', { method: 'POST', body: JSON.stringify({ name, species }) });
    if (!res.success || !res.data) return res.error ?? 'No pudimos guardar tu mascota.';
    setPets((p) => [res.data!, ...p]);
    return null;
  }

  function choosePet(p: Pet) {
    setPet(p);
    setError(null);
    setStep('vet');
    void searchVets(coords.lat, coords.lon);
  }

  function shareLocation() {
    if (!('geolocation' in navigator)) return setLocationNote('Tu navegador no permite compartir ubicación.');
    navigator.geolocation.getCurrentPosition(
      ({ coords: c }) => {
        setCoords({ lat: c.latitude, lon: c.longitude });
        setLocationNote('Buscamos cerca de tu ubicación actual.');
        void searchVets(c.latitude, c.longitude);
      },
      () => setLocationNote('No pudimos obtener tu ubicación; usamos el centro de tu comuna.'),
      { timeout: 10_000 },
    );
  }

  async function chooseVet(v: NearbyVet) {
    setVet(v);
    setIsLoading(true);
    const res = await clientApi<{ services: VetService[] }>(`/api/vets/${v.vet_id}`);
    setIsLoading(false);
    setServices(res.data?.services ?? []);
    setStep('service');
  }

  function chooseService(s: VetService) {
    setService(s);
    setDate(null);
    setTime(null);
    setStep('slot');
  }

  async function chooseDate(d: string) {
    setDate(d);
    setTime(null);
    setIsLoading(true);
    const res = await clientApi<{ slots: string[] }>(`/api/vets/${vet!.vet_id}/slots?date=${d}&service_type=home_visit`);
    setIsLoading(false);
    setSlots(res.data?.slots ?? []);
  }

  function chooseTime(t: string) {
    setTime(t);
    setError(null);
    setIdempotencyKey(crypto.randomUUID()); // una por intento: reintentos no duplican la cita
    setStep('review');
  }

  async function confirm() {
    setIsSubmitting(true);
    setError(null);
    const res = await clientApi('/api/appointments', {
      method: 'POST',
      body: JSON.stringify({
        pet_id: pet!.id, vet_id: vet!.vet_id, service_id: service!.id, service_type: 'home_visit',
        scheduled_date: date, scheduled_time: time, idempotency_key: idempotencyKey,
        ...(coords.lat != null && coords.lon != null ? { lat: coords.lat, lon: coords.lon } : {}),
      }),
    });
    setIsSubmitting(false);
    if (res.success) return setStep('done');
    setError(res.error ?? 'No pudimos confirmar la reserva.');
    if (res.error?.includes('horario')) {
      setStep('slot');
      void chooseDate(date!);
    }
  }

  const back = () => {
    const index = STEPS.findIndex((s) => s.key === step);
    if (index > 0) setStep(STEPS[index - 1]!.key);
  };
  const stepIndex = STEPS.findIndex((s) => s.key === step);

  if (step === 'done') {
    return (
      <div className="motion-safe:animate-[fadeIn_300ms_ease-out]">
        <p className="text-4xl" aria-hidden="true">✓</p>
        <StepTitle>¡Reserva enviada!</StepTitle>
        <p className="mt-3 text-base text-ink/80">
          {vet?.full_name} visitará a {pet?.name} el {date && formatDate(date).toLowerCase()} a las {time}.
          Te avisaremos cuando confirme la visita.
        </p>
        <Link href="/mis-citas" className="mt-6 inline-block rounded-lg bg-paw-600 px-6 py-3 font-semibold text-white hover:bg-paw-700">
          Ver mis citas
        </Link>
      </div>
    );
  }

  return (
    <div>
      <ol className="mb-6 flex gap-1" aria-label="Pasos de la reserva">
        {STEPS.map((s, i) => (
          <li key={s.key} className="flex-1" aria-current={i === stepIndex ? 'step' : undefined}>
            <span className={`block h-1 rounded-full transition-colors duration-300 ${i <= stepIndex ? 'bg-paw-600' : 'bg-paw-100'}`} />
            <span className={`mt-1 block text-[11px] font-medium ${i === stepIndex ? 'text-paw-700' : 'text-ink/50'}`}>{s.label}</span>
          </li>
        ))}
      </ol>

      <div key={step} className="motion-safe:animate-[fadeIn_250ms_ease-out]">
        {step === 'pet' && <PetStep pets={pets} selectedId={pet?.id ?? null} onSelect={choosePet} onCreate={createPet} />}
        {step === 'vet' && (
          <VetStep vets={vets} isLoading={isLoading} selectedId={vet?.vet_id ?? null} onSelect={chooseVet}
            onUseLocation={shareLocation} locationNote={locationNote} />
        )}
        {step === 'service' && (services.length > 0
          ? <ServiceStep services={services} selectedId={service?.id ?? null} onSelect={chooseService} />
          : <p className="text-sm text-ink/70">{isLoading ? 'Cargando servicios…' : 'Este veterinario aún no publica servicios.'}</p>)}
        {step === 'slot' && (
          <SlotStep dates={dates} date={date} onDate={chooseDate} slots={slots} isLoading={isLoading} time={time} onTime={chooseTime} />
        )}
        {step === 'review' && service && (
          <ReviewStep
            total={totalPrice(service)}
            error={error}
            rows={[
              ['Mascota', pet?.name ?? ''],
              ['Veterinario', vet?.full_name ?? ''],
              ['Servicio', SERVICE_KIND_LABEL[service.kind]],
              ['Fecha', date ? formatDate(date) : ''],
              ['Hora', time ?? ''],
              ['Dirección', owner.address ?? ''],
              ['Incluye traslado', formatClp(service.home_visit_fee_clp ?? 0)],
            ]}
          />
        )}
      </div>

      {step !== 'review' && error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="mt-8 flex items-center justify-between gap-3">
        {stepIndex > 0 ? (
          <button type="button" onClick={back} className="rounded-lg px-4 py-3 text-sm font-semibold text-ink hover:bg-paw-50">
            ← Atrás
          </button>
        ) : <span />}
        {step === 'review' && (
          <button type="button" onClick={confirm} disabled={isSubmitting}
            className="flex-1 rounded-lg bg-paw-600 px-6 py-3.5 font-semibold text-white transition hover:bg-paw-700 active:scale-[0.99] disabled:opacity-50">
            {isSubmitting ? 'Confirmando…' : 'Confirmar reserva'}
          </button>
        )}
      </div>
    </div>
  );
}
