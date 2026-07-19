import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Logo } from '@/components/logo';
import { SidebarNav } from './sidebar-nav';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-col bg-paw-950">
        <div className="px-5 py-6">
          <Link href="/" aria-label="Ir a la página de inicio">
            <Logo variant="light" />
          </Link>
        </div>
        <SidebarNav />
        <div className="border-t border-cream/10 px-5 py-4 text-cream">
          <UserButton showName />
        </div>
      </aside>
      <main className="flex-1 bg-cream p-8 lg:p-10">{children}</main>
    </div>
  );
}
