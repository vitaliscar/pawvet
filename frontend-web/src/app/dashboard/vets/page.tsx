import { apiFetch } from '@/lib/api';
import { VerifyButtons } from './verify-buttons';

interface PendingVet {
  id: string;
  full_name: string;
  rut: string;
  license_number: string;
  clinic_name: string | null;
  rut_document_url: string | null;
  license_document_url: string | null;
  created_at: string;
}

export default async function PendingVetsPage() {
  const res = await apiFetch<PendingVet[]>('/api/admin/vets/pending');
  const vets = res.data ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-paw-900">Veterinarios pendientes</h1>
      <p className="mt-1 text-sm text-ink/70">
        Verifica RUT y licencia del Colegio de Veterinarios antes de aprobar.
      </p>

      {!res.success && (
        <p className="mt-6 rounded-md bg-red-50 p-4 text-sm text-red-700">{res.error}</p>
      )}

      {res.success && vets.length === 0 && (
        <p className="mt-6 text-sm text-ink/60">No hay veterinarios pendientes. 🎉</p>
      )}

      <ul className="mt-6 space-y-4">
        {vets.map((vet) => (
          <li key={vet.id} className="rounded-lg border border-paw-100 bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold text-ink">{vet.full_name}</h2>
                <dl className="mt-1 text-sm text-ink/70">
                  <div>
                    RUT: <span className="font-mono">{vet.rut}</span> · Licencia:{' '}
                    <span className="font-mono">{vet.license_number}</span>
                  </div>
                  {vet.clinic_name && <div>Clínica: {vet.clinic_name}</div>}
                </dl>
                <div className="mt-2 flex gap-3 text-sm">
                  {vet.rut_document_url && (
                    <a href={vet.rut_document_url} className="text-paw-600 underline" target="_blank">
                      Documento RUT
                    </a>
                  )}
                  {vet.license_document_url && (
                    <a href={vet.license_document_url} className="text-paw-600 underline" target="_blank">
                      Documento licencia
                    </a>
                  )}
                </div>
              </div>
              <VerifyButtons vetId={vet.id} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
