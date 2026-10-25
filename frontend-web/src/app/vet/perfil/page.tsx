import { apiFetch } from '@/lib/api';
import { ProfileForm, type VetProfile } from './profile-form';

export default async function VetProfilePage() {
  const res = await apiFetch<VetProfile>('/api/vets/me');

  return (
    <div>
      <h1 className="font-serif text-4xl tracking-tight text-paw-900">Perfil</h1>
      <p className="mt-1 text-sm text-ink/70">
        Tu comuna base define en qué búsquedas apareces. RUT y título solo los cambia PAWVET tras verificarlos.
      </p>
      {res.success && res.data ? (
        <ProfileForm initial={res.data} />
      ) : (
        <p className="mt-6 rounded-md bg-red-50 p-4 text-sm text-red-700">{res.error}</p>
      )}
    </div>
  );
}
