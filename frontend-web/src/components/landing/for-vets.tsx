import { BadgeCheck, CalendarClock, MapPinned, Wallet } from 'lucide-react';
import Image from 'next/image';

const BENEFITS = [
  {
    icon: CalendarClock,
    title: 'Tú decides tu agenda',
    description: 'Define tus horarios, radio de cobertura y tipos de atención.',
  },
  {
    icon: Wallet,
    title: 'Pagos sin fricción',
    description: 'Cobra automáticamente con Transbank después de cada cita.',
  },
  {
    icon: MapPinned,
    title: 'Pacientes cerca de ti',
    description: 'Recibe solicitudes solo dentro de tu zona de atención.',
  },
  {
    icon: BadgeCheck,
    title: 'Perfil verificado',
    description: 'Tu licencia validada genera confianza y más reservas.',
  },
] as const;

export function ForVets() {
  return (
    <section id="veterinarios" className="scroll-mt-20 bg-paw-950 py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
        <div className="relative order-2 lg:order-1">
          <div className="absolute -left-5 -top-5 hidden h-full w-full rounded-4xl bg-paw-900 md:block" aria-hidden />
          <Image
            src="/images/vet-professional.png"
            alt="Veterinaria profesional con tablet frente a su clínica"
            width={560}
            height={560}
            className="relative rounded-4xl object-cover"
          />
        </div>

        <div className="order-1 flex flex-col gap-8 lg:order-2">
          <div className="flex flex-col gap-3">
            <span className="text-sm font-bold uppercase tracking-widest text-clay-300">
              Para veterinarios
            </span>
            <h2 className="text-balance font-display text-4xl font-bold tracking-tight text-cream md:text-5xl">
              Haz crecer tu práctica con PAWVET
            </h2>
            <p className="text-pretty leading-relaxed text-cream/70">
              Únete a la red de profesionales verificados y llega a miles de dueños de mascotas que
              buscan atención de calidad en su comuna.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {BENEFITS.map((benefit) => (
              <div key={benefit.title} className="flex flex-col gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-paw-800 text-clay-300">
                  <benefit.icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="font-display font-bold text-cream">{benefit.title}</h3>
                <p className="text-sm leading-relaxed text-cream/60">{benefit.description}</p>
              </div>
            ))}
          </div>

          <a
            href="#contacto"
            className="inline-flex w-fit items-center rounded-full bg-clay-400 px-7 py-3.5 font-semibold text-cream transition hover:bg-clay-500 focus:outline-none focus:ring-2 focus:ring-clay-300 focus:ring-offset-2 focus:ring-offset-paw-950"
          >
            Postula como veterinario
          </a>
        </div>
      </div>
    </section>
  );
}
