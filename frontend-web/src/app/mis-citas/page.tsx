import Link from 'next/link';
import { AppointmentActions } from '@/app/vet/appointment-actions';
import { apiFetch } from '@/lib/api';
import {
  formatClp, formatDate, SERVICE_KIND_LABEL, STATUS_LABEL, type AppointmentStatus, type ServiceKind,
} from '@/lib/labels';

interface OwnerAppointment {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: AppointmentStatus;
  price_clp: number | null;
  pet_name: string | null;
  service_kind: ServiceKind | null;
  vet_name: string | null;
  cancel_reason: string;
}

const STATUS_HINT: Record<AppointmentStatus, string> = {
  pending: 'Esperando que el veterinario confirme.',
  confirmed: 'Visita confirmada. Paga directamente al veterinario al finalizar.',
  completed: 'Atención realizada.',
  cancelled: 'Cita cancelada.',
};

export default async function MyAppointmentsPage() {
  const res = await apiFetch<OwnerAppointment[]>('/api/appointments');
  const appointments = [...(res.data ?? [])].sort((a, b) =>
    `${b.scheduled_date} ${b.scheduled_time}`.localeCompare(`${a.scheduled_date} ${a.scheduled_time}`),
  );

  return (
    <main className="min-h-screen bg-[#f4f4ec]">
      <header className="border-b border-paw-100 bg-white">
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-3">
          <Link href="/" className="font-serif text-2xl tracking-tight text-paw-900">
            PAWVET<span className="text-clay">.</span>
          </Link>
          <Link href="/reservar" className="rounded-lg bg-paw-600 px-4 py-2 text-sm font-semibold text-white hover:bg-paw-700">
            Nueva reserva
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-xl px-4 py-6">
        <h1 className="font-serif text-4xl tracking-tight text-paw-900">Mis citas</h1>
        {!res.success && <p className="mt-4 rounded-md bg-red-50 p-4 text-sm text-red-700">{res.error}</p>}
        {res.success && appointments.length === 0 && (
          <p className="mt-6 rounded-xl border border-dashed border-paw-100 bg-white p-6 text-sm text-ink/70">
            Aún no tienes citas. <Link href="/reservar" className="font-semibold text-paw-700 underline">Agenda tu primera visita</Link>.
          </p>
        )}
        <ul className="mt-6 space-y-3">
          {appointments.map((a) => (
            <li key={a.id} className="rounded-xl border border-paw-100 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-ink/70">{formatDate(a.scheduled_date)}</p>
                  <p className="text-2xl font-bold tabular-nums text-paw-900">{a.scheduled_time}</p>
                </div>
                <span className="rounded-full bg-paw-50 px-3 py-1 text-xs font-semibold text-paw-700">{STATUS_LABEL[a.status]}</span>
              </div>
              <p className="mt-3 font-semibold text-ink">
                {a.pet_name} · {a.service_kind ? SERVICE_KIND_LABEL[a.service_kind] : 'Servicio'}
              </p>
              <p className="text-sm text-ink/70">{a.vet_name} · {formatClp(a.price_clp)}</p>
              <p className="mt-2 text-sm text-ink/60">{STATUS_HINT[a.status]}</p>
              {a.status === 'cancelled' && a.cancel_reason && <p className="text-sm text-red-700">Motivo: {a.cancel_reason}</p>}
              <AppointmentActions id={a.id} status={a.status} canAdvance={false} />
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
