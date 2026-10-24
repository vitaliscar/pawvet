import Link from 'next/link';
import type { ReactNode } from 'react';
import { SignOutButton } from '@/app/dashboard/sign-out-button';
import { createServerPb } from '@/lib/pocketbase/server';

const NAV_ITEMS = [
  { href: '/vet', label: 'Agenda' },
  { href: '/vet/servicios', label: 'Servicios' },
  { href: '/vet/disponibilidad', label: 'Disponibilidad' },
] as const;

// Mobile-first: el veterinario usa el panel en el teléfono durante las visitas.
export default async function VetLayout({ children }: { children: ReactNode }) {
  const pb = await createServerPb();
  const email = pb.authStore.isValid ? (pb.authStore.record?.email ?? '') : '';

  return (
    <div className="min-h-screen bg-[#f4f4ec]">
      <header className="sticky top-0 z-10 border-b border-paw-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/vet" className="font-serif text-2xl tracking-tight text-paw-900">
            PAWVET<span className="text-clay">.</span>
          </Link>
          <div className="w-44">
            <SignOutButton email={email} />
          </div>
        </div>
        <nav aria-label="Panel veterinario" className="mx-auto flex max-w-3xl gap-1 overflow-x-auto px-2 pb-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium text-ink transition hover:bg-paw-50 hover:text-paw-700 focus:outline-none focus:ring-2 focus:ring-paw-500"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}
