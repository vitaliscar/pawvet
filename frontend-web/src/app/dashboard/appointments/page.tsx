import { apiFetch } from '@/lib/api';

interface Appointment {
  id: string;
  service_type: 'home_visit' | 'clinic_visit';
  scheduled_date: string;
  scheduled_time: string;
  price_clp: number | null;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  owner_rating: number | null;
}

const STATUS_LABEL: Record<Appointment['status'], string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

const SERVICE_LABEL: Record<Appointment['service_type'], string> = {
  home_visit: 'Domicilio',
  clinic_visit: 'Consultorio',
};

export default async function AppointmentsPage() {
  const res = await apiFetch<Appointment[]>('/api/appointments');
  const appointments = res.data ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-paw-900">Citas</h1>

      {!res.success && (
        <p className="mt-6 rounded-md bg-red-50 p-4 text-sm text-red-700">{res.error}</p>
      )}

      <div className="mt-6 overflow-x-auto rounded-lg border border-paw-100 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-paw-50 text-left text-paw-900">
            <tr>
              <th className="px-4 py-3 font-semibold">Fecha</th>
              <th className="px-4 py-3 font-semibold">Hora</th>
              <th className="px-4 py-3 font-semibold">Tipo</th>
              <th className="px-4 py-3 font-semibold">Precio (CLP)</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
              <th className="px-4 py-3 font-semibold">Rating</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appt) => (
              <tr key={appt.id} className="border-t border-paw-100">
                <td className="px-4 py-3">{appt.scheduled_date}</td>
                <td className="px-4 py-3">{appt.scheduled_time}</td>
                <td className="px-4 py-3">{SERVICE_LABEL[appt.service_type]}</td>
                <td className="px-4 py-3">
                  {appt.price_clp != null ? `$${appt.price_clp.toLocaleString('es-CL')}` : '—'}
                </td>
                <td className="px-4 py-3">{STATUS_LABEL[appt.status]}</td>
                <td className="px-4 py-3">{appt.owner_rating ?? '—'}</td>
              </tr>
            ))}
            {appointments.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-ink/60">
                  Sin citas registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
