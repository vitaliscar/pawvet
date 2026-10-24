import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import {
  formatClp,
  formatDate,
  SERVICE_KIND_LABEL,
  STATUS_LABEL,
  type AppointmentStatus,
  type ServiceKind,
} from '@/lib/labels';
import { AppointmentActions } from './appointment-actions';

interface AgendaItem {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: AppointmentStatus;
  price_clp: number | null;
  pet_name: string | null;
  service_kind: ServiceKind | null;
  owner_name: string | null;
  address: string | null;
  cancel_reason: string;
}

const STATUS_STYLE: Record<AppointmentStatus, string> = {
  pending: 'bg-clay/15 text-[#9a3f1f]',
  confirmed: 'bg-paw-100 text-paw-700',
  completed: 'bg-ink/5 text-ink/70',
  cancelled: 'bg-red-50 text-red-700',
};

const isUpcoming = (a: AgendaItem) => a.status === 'pending' || a.status === 'confirmed';
const byStart = (a: AgendaItem, b: AgendaItem) =>
  `${a.scheduled_date} ${a.scheduled_time}`.localeCompare(`${b.scheduled_date} ${b.scheduled_time}`);

function AppointmentCard({ appt }: { appt: AgendaItem }) {
  const mapsUrl = appt.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(appt.address)}`
    : null;
  return (
    <li className="rounded-xl border border-paw-100 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink/70">{formatDate(appt.scheduled_date)}</p>
          <p className="text-3xl font-bold tabular-nums text-paw-900">{appt.scheduled_time}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[appt.status]}`}>
          {STATUS_LABEL[appt.status]}
        </span>
      </div>
      <p className="mt-3 text-base font-semibold text-ink">
        {appt.pet_name ?? 'Mascota'} · {appt.service_kind ? SERVICE_KIND_LABEL[appt.service_kind] : 'Servicio'}
      </p>
      <p className="text-sm text-ink/70">
        {appt.owner_name ?? 'Tutor'} · {formatClp(appt.price_clp)}
      </p>
      {mapsUrl && (
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-1 block w-fit text-sm text-paw-700 underline">
          {appt.address}
        </a>
      )}
      {appt.status === 'cancelled' && appt.cancel_reason && (
        <p className="mt-2 text-sm text-red-700">Motivo: {appt.cancel_reason}</p>
      )}
      <AppointmentActions id={appt.id} status={appt.status} />
      {appt.status !== 'cancelled' && (
        <Link href={`/vet/citas/${appt.id}`} className="mt-3 block w-fit text-sm font-semibold text-paw-700 hover:underline">
          Notas clínicas →
        </Link>
      )}
    </li>
  );
}

export default async function VetAgendaPage() {
  const res = await apiFetch<AgendaItem[]>('/api/appointments');
  const all = res.data ?? [];
  const upcoming = all.filter(isUpcoming).sort(byStart);
  const history = all.filter((a) => !isUpcoming(a)).sort(byStart).reverse();

  return (
    <div>
      <h1 className="font-serif text-4xl tracking-tight text-paw-900">Agenda</h1>
      {!res.success && <p className="mt-4 rounded-md bg-red-50 p-4 text-sm text-red-700">{res.error}</p>}

      <section aria-labelledby="proximas" className="mt-6">
        <h2 id="proximas" className="text-sm font-semibold uppercase tracking-wide text-ink/60">
          Próximas ({upcoming.length})
        </h2>
        {upcoming.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-paw-100 bg-white p-6 text-sm text-ink/70">
            No tienes citas próximas. Revisa que tus <Link href="/vet/servicios" className="font-semibold text-paw-700 underline">servicios</Link> y tu{' '}
            <Link href="/vet/disponibilidad" className="font-semibold text-paw-700 underline">disponibilidad</Link> estén publicados.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">{upcoming.map((a) => <AppointmentCard key={a.id} appt={a} />)}</ul>
        )}
      </section>

      {history.length > 0 && (
        <section aria-labelledby="historial" className="mt-10">
          <h2 id="historial" className="text-sm font-semibold uppercase tracking-wide text-ink/60">Historial</h2>
          <ul className="mt-3 space-y-3">{history.map((a) => <AppointmentCard key={a.id} appt={a} />)}</ul>
        </section>
      )}
    </div>
  );
}
