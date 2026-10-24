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

export default async function DashboardHome() {
  const res = await apiFetch<Metrics>('/api/admin/metrics');
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
    </div>
  );
}
