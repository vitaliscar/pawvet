import { CalendarCheck, Home, Search } from 'lucide-react';

const STEPS = [
  {
    icon: Search,
    title: 'Busca cerca de ti',
    description:
      'Explora veterinarios verificados en tu comuna con el mapa y filtra por especialidad y radio de atención.',
  },
  {
    icon: CalendarCheck,
    title: 'Agenda en segundos',
    description:
      'Elige día y hora según la disponibilidad real del profesional. Paga seguro con Transbank.',
  },
  {
    icon: Home,
    title: 'Atención en tu casa',
    description:
      'El veterinario llega a tu domicilio con todo lo necesario. Tu mascota, tranquila en su espacio.',
  },
] as const;

export function HowItWorks() {
  return (
    <section id="como-funciona" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="text-sm font-bold uppercase tracking-widest text-clay-500">
          Cómo funciona
        </span>
        <h2 className="text-balance font-display text-4xl font-bold tracking-tight text-paw-950 md:text-5xl">
          Tres pasos y listo
        </h2>
      </div>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {STEPS.map((step, i) => (
          <div
            key={step.title}
            className="flex flex-col gap-4 rounded-4xl border border-paw-100 bg-white p-8 shadow-card"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-paw-600 text-cream">
                <step.icon className="h-6 w-6" aria-hidden />
              </span>
              <span className="font-display text-5xl font-bold text-paw-100" aria-hidden>
                {String(i + 1).padStart(2, '0')}
              </span>
            </div>
            <h3 className="font-display text-xl font-bold text-paw-950">{step.title}</h3>
            <p className="text-sm leading-relaxed text-ink/70">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
