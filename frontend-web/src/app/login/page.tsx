'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { createClientPb } from '@/lib/pocketbase/client';

const HOME_BY_ROLE: Record<string, string> = { admin: '/dashboard', vet: '/vet' };

/** Solo rutas internas dentro del área del rol (evita open redirect con ?next=). */
function destinationFor(role: string, next: string | null): string {
  const home = HOME_BY_ROLE[role] ?? '/';
  if (next && (next === home || next.startsWith(`${home}/`))) return next;
  return home;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsBusy(true);
    setError(null);
    const pb = createClientPb();
    let role = '';
    try {
      await pb.collection('users').authWithPassword(email, password);
      role = pb.authStore.record?.role ?? '';
      if (!(role in HOME_BY_ROLE)) {
        pb.authStore.clear();
        setError('Este acceso es para veterinarios y administradores.');
        setIsBusy(false);
        return;
      }
    } catch {
      setError('Credenciales inválidas.');
      setIsBusy(false);
      return;
    }
    setIsBusy(false);
    router.push(destinationFor(role, searchParams.get('next')));
    router.refresh();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#e8e9dc] px-6">
      <div className="text-center">
        <h1 className="font-serif text-5xl tracking-tight text-paw-900">PAWVET<span className="text-clay">.</span></h1>
        <p className="mt-2 text-sm font-semibold text-paw-700">Acceso para veterinarios y administración</p>
      </div>
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 bg-white p-8 shadow-sm">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink">
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-paw-100 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-paw-500"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-ink">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-paw-100 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-paw-500"
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={isBusy}
          className="w-full rounded-lg bg-paw-600 px-6 py-3 font-semibold text-white transition hover:bg-paw-700 disabled:opacity-50"
        >
          {isBusy ? 'Ingresando…' : 'Iniciar sesión'}
        </button>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
