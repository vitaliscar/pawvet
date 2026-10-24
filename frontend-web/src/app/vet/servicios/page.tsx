import { apiFetch } from '@/lib/api';
import { ServicesForm, type VetService } from './services-form';

interface VetMe {
  services: VetService[];
}

export default async function VetServicesPage() {
  const res = await apiFetch<VetMe>('/api/vets/me');

  return (
    <div>
      <h1 className="font-serif text-4xl tracking-tight text-paw-900">Servicios</h1>
      <p className="mt-1 text-sm text-ink/70">
        Cada visita ocupa un bloque de 60 minutos que incluye el traslado. El tutor ve el precio final antes de reservar.
      </p>
      {res.success && res.data ? (
        <ServicesForm existing={res.data.services} />
      ) : (
        <p className="mt-6 rounded-md bg-red-50 p-4 text-sm text-red-700">{res.error}</p>
      )}
    </div>
  );
}
