'use client';

import { useRouter } from 'next/navigation';
import { createClientPb } from '@/lib/pocketbase/client';

export function SignOutButton({ email }: { email: string }) {
  const router = useRouter();

  function signOut() {
    createClientPb().authStore.clear();
    router.push('/login');
    router.refresh();
  }

  return (
    <button
      onClick={signOut}
      className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm text-ink transition hover:bg-paw-50"
    >
      <span className="truncate">{email}</span>
      <span className="text-xs font-semibold text-paw-700">Salir</span>
    </button>
  );
}
