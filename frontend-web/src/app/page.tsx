import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6">
      <div className="text-center">
        <p className="mb-2 text-5xl" aria-hidden>
          🐾
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-paw-900">PAWVET</h1>
        <p className="mt-2 text-lg text-paw-700">Huella Amiga — Panel de administración</p>
      </div>

      <SignedOut>
        <SignInButton mode="modal">
          <button className="rounded-lg bg-paw-600 px-6 py-3 font-semibold text-white transition hover:bg-paw-700 focus:outline-none focus:ring-2 focus:ring-paw-500 focus:ring-offset-2">
            Iniciar sesión
          </button>
        </SignInButton>
      </SignedOut>

      <SignedIn>
        <Link
          href="/dashboard"
          className="rounded-lg bg-paw-600 px-6 py-3 font-semibold text-white transition hover:bg-paw-700"
        >
          Ir al dashboard →
        </Link>
      </SignedIn>
    </main>
  );
}
