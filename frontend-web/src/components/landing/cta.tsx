import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import { ArrowRight, PawPrint } from 'lucide-react';
import Link from 'next/link';

export function Cta() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-20">
      <div className="relative overflow-hidden rounded-4xl bg-paw-600 px-8 py-16 text-center md:py-20">
        <PawPrint
          className="absolute -left-8 -top-8 h-40 w-40 rotate-12 text-paw-500/40"
          aria-hidden
        />
        <PawPrint
          className="absolute -bottom-10 -right-6 h-48 w-48 -rotate-12 text-paw-500/40"
          aria-hidden
        />
        <div className="relative flex flex-col items-center gap-6">
          <h2 className="max-w-2xl text-balance font-display text-4xl font-bold tracking-tight text-cream md:text-5xl">
            Tu mascota merece atención sin estrés
          </h2>
          <p className="max-w-lg text-pretty leading-relaxed text-cream/80">
            Agenda hoy tu primera visita a domicilio con un veterinario verificado.
          </p>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="inline-flex items-center gap-2 rounded-full bg-cream px-7 py-3.5 font-semibold text-paw-800 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-cream focus:ring-offset-2 focus:ring-offset-paw-600">
                Comenzar ahora
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-cream px-7 py-3.5 font-semibold text-paw-800 transition hover:bg-white"
            >
              Ir al panel
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </SignedIn>
        </div>
      </div>
    </section>
  );
}
