import Link from 'next/link';
import { apiFetch } from '@/lib/api';

interface Metrics {
  vets: { pending: number; verified: number };
  owners: number;
  appointments: {
    today: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
}

const STATUS_ROWS = [
  { key: 'pending', label: 'Pendientes de confirmar' },
  { key: 'confirmed', label: 'Confirmadas' },
  { key: 'completed', label: 'Completadas' },
  { key: 'cancelled', label: 'Canceladas' },
] as const;

interface PilotMetrics {
  days: number;
  searchers: number;
  bookers: number;
  search_to_booking_pct: number | null;
  appointments: { total: number; completed: number; cancelled: number };
  cancellation_pct: number | null;
  by_vet: { vet_id: string; vet_name: string; total: number; completed: number; cancelled: number }[];
}

const pct = (v: number | null) => (v == null ? '—' : `${v.toLocaleString('es-CL')} %`);

function PilotSection({ p }: { p: PilotMetrics }) {
  const kpis = [
    { label: 'Búsqueda → reserva', value: pct(p.search_to_booking_pct), hint: `${p.bookers} de ${p.searchers} tutores` },
    { label: 'Citas completadas', value: String(p.appointments.completed), hint: `de ${p.appointments.total} reservadas` },
    {
      label: 'Cancelación',
      value: pct(p.cancellation_pct),
      hint: `${p.appointments.cancelled} ${p.appointments.cancelled === 1 ? 'cancelada' : 'canceladas'}`,
    },
  ];
  return (
    <section aria-labelledby="piloto" className="mt-10">
      <h2 id="piloto" className="text-lg font-bold text-paw-900">Piloto · últimos {p.days} días</h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-3">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-paw-100 bg-white p-5">
            <dt className="text-sm font-medium text-ink/70">{k.label}</dt>
            <dd className="mt-1 text-3xl font-bold tabular-nums text-paw-900">{k.value}</dd>
            <dd className="mt-1 text-sm text-ink/60">{k.hint}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 overflow-x-auto rounded-xl border border-paw-100 bg-white">
        <table className="min-w-full text-sm">
          <caption className="sr-only">Reservas por veterinario</caption>
          <thead className="bg-paw-50 text-left text-paw-900">
            <tr>
              <th className="px-4 py-3 font-semibold">Veterinario</th>
              <th className="px-4 py-3 text-right font-semibold">Reservas</th>
              <th className="px-4 py-3 text-right font-semibold">Completadas</th>
              <th className="px-4 py-3 text-right font-semibold">Canceladas</th>
            </tr>
          </thead>
          <tbody>
            {p.by_vet.map((v) => (
              <tr key={v.vet_id} className="border-t border-paw-100">
                <td className="px-4 py-3">{v.vet_name}</td>
                <td className="px-4 py-3 text-right tabular-nums">{v.total}</td>
                <td className="px-4 py-3 text-right tabular-nums">{v.completed}</td>
                <td className="px-4 py-3 text-right tabular-nums">{v.cancelled}</td>
              </tr>
            ))}
            {p.by_vet.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-ink/60">Sin reservas en el periodo.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default async function DashboardHome() {
  const [res, pilot] = await Promise.all([
    apiFetch<Metrics>('/api/admin/metrics'),
    apiFetch<PilotMetrics>('/api/admin/pilot-metrics?days=28'),
  ]);
  const m = res.data;

  return (
    <div>
      <h1 className="text-2xl font-bold text-paw-900">Resumen</h1>

      {!res.success && (
        <p className="mt-6 rounded-md bg-red-50 p-4 text-sm text-red-700">{res.error}</p>
      )}

      {m && (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <Link
            href="/dashboard/vets"
            className="group rounded-xl border border-clay/30 bg-white p-6 transition hover:border-clay focus:outline-none focus:ring-2 focus:ring-clay"
          >
            <p className="text-sm font-medium text-ink/70">Veterinarios por verificar</p>
            <p className="mt-2 text-5xl font-bold tabular-nums text-clay">{m.vets.pending}</p>
            <p className="mt-3 text-sm font-semibold text-paw-700 group-hover:underline">
              Revisar documentos →
            </p>
          </Link>

          <div className="rounded-xl border border-paw-100 bg-white p-6">
            <p className="text-sm font-medium text-ink/70">Citas de hoy</p>
            <p className="mt-2 text-5xl font-bold tabular-nums text-paw-900">{m.appointments.today}</p>
            <p className="mt-3 text-sm text-ink/60">
              {m.vets.verified} veterinarios activos · {m.owners} tutores
            </p>
          </div>

          <div className="rounded-xl border border-paw-100 bg-white p-6">
            <p className="text-sm font-medium text-ink/70">Citas por estado</p>
            <dl className="mt-3 space-y-2">
              {STATUS_ROWS.map((row) => (
                <div key={row.key} className="flex items-baseline justify-between text-sm">
                  <dt className="text-ink/80">{row.label}</dt>
                  <dd className="font-semibold tabular-nums text-ink">{m.appointments[row.key]}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}

      {pilot.data && <PilotSection p={pilot.data} />}
    </div>
  );
}
