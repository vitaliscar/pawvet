import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import { ArrowRight, ShieldCheck, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-20 pt-14 md:pt-20">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div className="flex flex-col items-start gap-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-paw-100 px-4 py-1.5 text-sm font-semibold text-paw-800">
            <ShieldCheck className="h-4 w-4" aria-hidden />
            Veterinarios verificados en Chile
          </span>

          <h1 className="text-balance font-display text-5xl font-bold leading-[1.05] tracking-tight text-paw-950 md:text-6xl lg:text-7xl">
            El veterinario llega a tu puerta
          </h1>

          <p className="max-w-md text-pretty text-lg leading-relaxed text-ink/70">
            Agenda atención a domicilio o en consultorio con profesionales verificados. Tu mascota
            se atiende donde está más tranquila: en casa.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="inline-flex items-center gap-2 rounded-full bg-paw-600 px-7 py-3.5 font-semibold text-cream transition hover:bg-paw-700 focus:outline-none focus:ring-2 focus:ring-paw-500 focus:ring-offset-2 focus:ring-offset-cream">
                  Agenda una visita
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-full bg-paw-600 px-7 py-3.5 font-semibold text-cream transition hover:bg-paw-700"
              >
                Ir al panel
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </SignedIn>
            <a
              href="#como-funciona"
              className="rounded-full border-2 border-paw-200 px-7 py-3 font-semibold text-paw-800 transition hover:border-paw-400 hover:bg-paw-50"
            >
              Cómo funciona
            </a>
          </div>

          <div className="flex items-center gap-2 text-sm text-ink/60">
            <span className="flex text-clay-400" aria-hidden>
              <Star className="h-4 w-4 fill-current" />
              <Star className="h-4 w-4 fill-current" />
              <Star className="h-4 w-4 fill-current" />
              <Star className="h-4 w-4 fill-current" />
              <Star className="h-4 w-4 fill-current" />
            </span>
            Miles de mascotas atendidas en todo Chile
          </div>
        </div>

        <div className="relative">
          <div className="absolute -right-6 -top-6 hidden h-full w-full rounded-4xl bg-paw-100 md:block" aria-hidden />
          <Image
            src="/images/hero-vet.png"
            alt="Veterinaria atendiendo a un perro golden retriever en el living de una casa"
            width={640}
            height={480}
            priority
            className="relative rounded-4xl object-cover shadow-lifted"
          />
          <div className="absolute -bottom-5 left-6 flex items-center gap-3 rounded-2xl bg-white px-5 py-3.5 shadow-lifted">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-clay-100 text-clay-600">
              <ShieldCheck className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-bold text-paw-950">Licencia verificada</p>
              <p className="text-xs text-ink/60">Colegio de Veterinarios</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
