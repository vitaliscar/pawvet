'use client';

import { CalendarDays, LayoutDashboard, ScrollText, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Resumen', icon: LayoutDashboard },
  { href: '/dashboard/vets', label: 'Verificar vets', icon: ShieldCheck },
  { href: '/dashboard/appointments', label: 'Citas', icon: CalendarDays },
  { href: '/dashboard/audit', label: 'Auditoría', icon: ScrollText },
] as const;

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegación principal" className="flex flex-1 flex-col gap-1 px-3">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              isActive
                ? 'bg-paw-800 text-cream'
                : 'text-cream/60 hover:bg-paw-900 hover:text-cream'
            }`}
          >
            <item.icon className="h-4 w-4" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
