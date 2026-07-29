import Link from 'next/link';
import { Reveal } from '@/components/reveal';
import { createServerPb } from '@/lib/pocketbase/server';

const STEPS = [
  {
    title: '1. Agenda',
    body: 'El dueño busca veterinarios verificados cerca de su hogar y elige un horario.',
  },
  {
    title: '2. Visita a domicilio',
    body: 'El veterinario llega con su equipo, revisa a la mascota y registra el historial médico.',
  },
  {
    title: '3. Seguimiento',
    body: 'Historial, recetas y próximos controles quedan disponibles para dueño y veterinario.',
  },
];

const AUDIENCES = [
  {
    title: 'Dueños de mascotas',
    body: 'Encuentra veterinarios verificados por RUT y Colegio de Veterinarios, agenda en minutos y ten el historial médico de tu mascota siempre a mano.',
    cta: 'Buscar veterinarios',
  },
  {
    title: 'Veterinarios',
    body: 'Gestiona tu disponibilidad, tus citas a domicilio y el historial clínico de tus pacientes desde un solo panel, con verificación profesional incluida.',
    cta: 'Únete como veterinario',
  },
];

export default async function HomePage() {
  const pb = await createServerPb();
  const user = pb.authStore.isValid ? pb.authStore.record : null;

  return (
    <main className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <span className="flex items-center gap-2 text-lg font-bold tracking-tight text-paw-900">
          <span aria-hidden>🐾</span> PAWVET
        </span>
        {user ? (
          <Link
            href="/dashboard"
            className="rounded-lg border border-paw-600 px-4 py-2 text-sm font-semibold text-paw-700 transition hover:bg-paw-50"
          >
            Ir al dashboard
          </Link>
        ) : (
          <Link
            href="/login"
            className="rounded-lg border border-paw-600 px-4 py-2 text-sm font-semibold text-paw-700 transition hover:bg-paw-50 focus:outline-none focus:ring-2 focus:ring-paw-500 focus:ring-offset-2"
          >
            Iniciar sesión
          </Link>
        )}
      </header>

      <section className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-6 py-20 text-center sm:py-28">
        <Reveal>
          <p className="mb-2 text-6xl" aria-hidden>
            🐾
          </p>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-paw-900 sm:text-6xl">
            Atención veterinaria a domicilio, con cariño y confianza
          </h1>
        </Reveal>
        <Reveal delay={160}>
          <p className="max-w-xl text-lg text-paw-700 sm:text-xl">
            Huella Amiga conecta a dueños de mascotas en Chile con veterinarios verificados,
            directo en la comodidad de tu hogar.
          </p>
        </Reveal>
        <Reveal delay={240}>
          <Link
            href={user ? '/dashboard' : '/login'}
            className="inline-block rounded-lg bg-paw-600 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-paw-700 focus:outline-none focus:ring-2 focus:ring-paw-500 focus:ring-offset-2"
          >
            {user ? 'Ir al dashboard →' : 'Comenzar ahora'}
          </Link>
        </Reveal>
      </section>

      <section className="bg-paw-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <h2 className="text-center text-3xl font-bold tracking-tight text-paw-900">
              Cómo funciona
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <Reveal key={step.title} delay={i * 100}>
                <div className="rounded-2xl bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-paw-800">{step.title}</h3>
                  <p className="mt-2 text-paw-700">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-8 sm:grid-cols-2">
            {AUDIENCES.map((a, i) => (
              <Reveal key={a.title} delay={i * 100}>
                <div className="flex h-full flex-col rounded-2xl border border-paw-100 p-8">
                  <h3 className="text-xl font-bold text-paw-900">{a.title}</h3>
                  <p className="mt-3 flex-1 text-paw-700">{a.body}</p>
                  {!user && (
                    <Link
                      href="/login"
                      className="mt-6 inline-block self-start rounded-lg bg-clay px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                      {a.cta}
                    </Link>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-paw-100 py-8 text-center text-sm text-paw-700">
        © {new Date().getFullYear()} PAWVET — Huella Amiga
      </footer>
    </main>
  );
}
