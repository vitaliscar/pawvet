'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { createClientPb } from '@/lib/pocketbase/client';

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
    try {
      await pb.collection('users').authWithPassword(email, password);
    } catch {
      setError('Credenciales inválidas.');
      setIsBusy(false);
      return;
    }
    setIsBusy(false);
    router.push(searchParams.get('next') ?? '/dashboard');
    router.refresh();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6">
      <div className="text-center">
        <p className="mb-2 text-5xl" aria-hidden>
          🐾
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-paw-900">PAWVET</h1>
        <p className="mt-1 text-paw-700">Iniciar sesión</p>
      </div>
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
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
