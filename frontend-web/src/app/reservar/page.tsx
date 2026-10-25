import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { BookingFlow, type Owner } from './booking-flow';
import type { Pet } from './steps';

export default async function ReservePage() {
  const [owner, pets] = await Promise.all([apiFetch<Owner>('/api/owners/me'), apiFetch<Pet[]>('/api/pets')]);

  return (
    <main className="min-h-screen bg-[#f4f4ec]">
      <header className="border-b border-paw-100 bg-white">
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-3">
          <Link href="/" className="font-serif text-2xl tracking-tight text-paw-900">
            PAWVET<span className="text-clay">.</span>
          </Link>
          <Link href="/mis-citas" className="text-sm font-semibold text-paw-700 hover:underline">Mis citas</Link>
        </div>
      </header>
      <div className="mx-auto max-w-xl px-4 py-6">
        {owner.success && owner.data ? (
          <BookingFlow owner={owner.data} initialPets={pets.data ?? []} />
        ) : (
          <p className="rounded-md bg-red-50 p-4 text-sm text-red-700">
            {owner.error ?? 'No encontramos tu perfil.'}{' '}
            <Link href="/registro" className="font-semibold underline">Completa tu registro</Link>
          </p>
        )}
      </div>
    </main>
  );
}
