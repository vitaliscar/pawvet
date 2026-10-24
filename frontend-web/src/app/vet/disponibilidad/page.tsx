import { apiFetch } from '@/lib/api';
import { AvailabilityForm, type AvailabilityWindow } from './availability-form';

interface VetMe {
  availability: AvailabilityWindow[];
}

export default async function VetAvailabilityPage() {
  const res = await apiFetch<VetMe>('/api/vets/me');

  return (
    <div>
      <h1 className="font-serif text-4xl tracking-tight text-paw-900">Disponibilidad</h1>
      <p className="mt-1 text-sm text-ink/70">
        Publica tus ventanas semanales para visitas a domicilio. Los tutores solo ven bloques libres de 60 minutos.
      </p>
      {res.success && res.data ? (
        <AvailabilityForm existing={res.data.availability} />
      ) : (
        <p className="mt-6 rounded-md bg-red-50 p-4 text-sm text-red-700">{res.error}</p>
      )}
    </div>
  );
}
