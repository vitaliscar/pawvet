import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { NotesForm, type MedicalNotes } from './notes-form';

export default async function AppointmentNotesPage({ params }: { params: { id: string } }) {
  const res = await apiFetch<MedicalNotes>(`/api/appointments/${encodeURIComponent(params.id)}/medical-notes`);

  return (
    <div>
      <Link href="/vet" className="text-sm font-semibold text-paw-700 hover:underline">
        ← Volver a la agenda
      </Link>
      <h1 className="mt-3 font-serif text-4xl tracking-tight text-paw-900">Notas clínicas</h1>
      <p className="mt-1 text-sm text-ink/70">
        Se guardan cifradas. Solo tú y el tutor de la mascota pueden leerlas.
      </p>
      {res.success && res.data ? (
        <NotesForm appointmentId={params.id} initial={res.data} />
      ) : (
        <p className="mt-6 rounded-md bg-red-50 p-4 text-sm text-red-700">{res.error ?? 'Cita no encontrada'}</p>
      )}
    </div>
  );
}
