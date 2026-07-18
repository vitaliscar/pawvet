import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import type { ReactNode } from 'react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Resumen' },
  { href: '/dashboard/vets', label: 'Verificar vets' },
  { href: '/dashboard/appointments', label: 'Citas' },
  { href: '/dashboard/audit', label: 'Auditoría' },
] as const;

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 flex-col border-r border-paw-100 bg-white">
        <div className="flex items-center gap-2 px-5 py-6">
          <span className="text-2xl" aria-hidden>
            🐾
          </span>
          <span className="text-lg font-bold text-paw-900">PAWVET</span>
        </div>
        <nav aria-label="Navegación principal" className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm font-medium text-ink transition hover:bg-paw-50 hover:text-paw-700"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-paw-100 px-5 py-4">
          <UserButton showName />
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
