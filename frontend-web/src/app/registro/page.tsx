'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ClientResponseError } from 'pocketbase';
import { useState } from 'react';
import { clientApi } from '@/lib/client-api';
import { BOOKING_TERMS, PILOT_COMMUNES, type PilotCommune } from '@/lib/pilot';
import { createClientPb } from '@/lib/pocketbase/client';

const MIN_PASSWORD = 8;
const inputClass =
  'w-full rounded-lg border border-paw-100 bg-white px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-paw-500';

function signupError(err: unknown): string {
  if (err instanceof ClientResponseError && JSON.stringify(err.response).includes('validation_not_unique')) {
    return 'Ese correo ya tiene una cuenta. Inicia sesión.';
  }
  return 'No pudimos crear tu cuenta. Revisa los datos e inténtalo de nuevo.';
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', address: '' });
  const [commune, setCommune] = useState<PilotCommune>('Providencia');
  const [hasAccepted, setHasAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < MIN_PASSWORD) return setError(`La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`);
    if (!hasAccepted) return setError('Debes aceptar las condiciones del piloto.');
    setIsBusy(true);
    setError(null);

    const pb = createClientPb();
    try {
      await pb.collection('users').create({
        email: form.email,
        password: form.password,
        passwordConfirm: form.password,
        role: 'owner', // PocketBase lo fuerza igualmente (pb_hooks/default_role)
      });
      await pb.collection('users').authWithPassword(form.email, form.password);
    } catch (err) {
      setIsBusy(false);
      return setError(signupError(err));
    }

    const center = PILOT_COMMUNES.find((c) => c.name === commune)!;
    const res = await clientApi('/api/owners/me', {
      method: 'PUT',
      body: JSON.stringify({
        full_name: form.name,
        address: `${form.address}, ${commune}`,
        lat: center.lat,
        lon: center.lon,
        terms_accepted: true,
        privacy_accepted: true,
      }),
    });
    setIsBusy(false);
    if (!res.success) return setError(res.error ?? 'No pudimos guardar tu perfil.');
    router.push('/reservar');
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#e8e9dc] px-4 py-10">
      <div className="mx-auto max-w-md">
        <Link href="/" className="font-serif text-4xl tracking-tight text-paw-900">
          PAWVET<span className="text-clay">.</span>
        </Link>
        <h1 className="mt-6 font-serif text-3xl leading-tight text-paw-900">Crea tu cuenta y agenda una visita</h1>
        <p className="mt-2 text-sm text-ink/70">
          Piloto disponible en {PILOT_COMMUNES.map((c) => c.name).join(' y ')}.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 bg-white p-6 shadow-sm">
          <label className="block text-sm font-medium text-ink">
            Nombre y apellido
            <input required maxLength={200} autoComplete="name" value={form.name} onChange={set('name')} className={`mt-1 ${inputClass}`} />
          </label>
          <label className="block text-sm font-medium text-ink">
            Correo electrónico
            <input required type="email" autoComplete="email" value={form.email} onChange={set('email')} className={`mt-1 ${inputClass}`} />
          </label>
          <label className="block text-sm font-medium text-ink">
            Contraseña (mínimo {MIN_PASSWORD} caracteres)
            <input required type="password" autoComplete="new-password" value={form.password} onChange={set('password')} className={`mt-1 ${inputClass}`} />
          </label>
          <fieldset>
            <legend className="text-sm font-medium text-ink">Comuna</legend>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {PILOT_COMMUNES.map((c) => (
                <label
                  key={c.name}
                  className={`cursor-pointer rounded-lg border px-3 py-2.5 text-center text-sm font-semibold transition ${
                    commune === c.name ? 'border-paw-600 bg-paw-50 text-paw-700' : 'border-paw-100 text-ink'
                  }`}
                >
                  <input type="radio" name="commune" value={c.name} checked={commune === c.name} onChange={() => setCommune(c.name)} className="sr-only" />
                  {c.name}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block text-sm font-medium text-ink">
            Dirección para la visita
            <input
              required maxLength={250} autoComplete="street-address" placeholder="Calle, número y depto."
              value={form.address} onChange={set('address')} className={`mt-1 ${inputClass}`}
            />
          </label>

          <div className="rounded-lg bg-paw-50 p-4">
            <p className="text-sm font-semibold text-paw-900">Condiciones del piloto</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink/80">
              {BOOKING_TERMS.map((term) => <li key={term}>{term}</li>)}
            </ul>
            <label className="mt-3 flex items-start gap-3 text-sm font-medium text-ink">
              <input
                type="checkbox" checked={hasAccepted} onChange={(e) => setHasAccepted(e.target.checked)}
                className="mt-0.5 h-5 w-5 rounded border-paw-100 text-paw-600 focus:ring-paw-500"
              />
              Acepto las condiciones y la política de privacidad.
            </label>
          </div>

          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <button
            type="submit" disabled={isBusy}
            className="w-full rounded-lg bg-paw-600 px-6 py-3 font-semibold text-white transition hover:bg-paw-700 active:scale-[0.99] disabled:opacity-50"
          >
            {isBusy ? 'Creando tu cuenta…' : 'Crear cuenta'}
          </button>
          <p className="text-center text-sm text-ink/70">
            ¿Ya tienes cuenta? <Link href="/login" className="font-semibold text-paw-700 underline">Inicia sesión</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
