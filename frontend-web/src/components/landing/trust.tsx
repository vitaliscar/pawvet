import { CreditCard, FileCheck, LockKeyhole } from 'lucide-react';

const PILLARS = [
  {
    icon: FileCheck,
    title: 'Licencias verificadas',
    description:
      'Cada profesional pasa por verificación de RUT y licencia del Colegio de Veterinarios antes de atender.',
  },
  {
    icon: LockKeyhole,
    title: 'Datos protegidos',
    description:
      'La información de tu mascota y la tuya viaja encriptada y se resguarda según la ley chilena.',
  },
  {
    icon: CreditCard,
    title: 'Pago seguro con Transbank',
    description:
      'Paga con tarjeta de forma segura. Solo se cobra cuando la cita queda confirmada.',
  },
] as const;

export function Trust() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="text-sm font-bold uppercase tracking-widest text-clay-500">Confianza</span>
        <h2 className="text-balance font-display text-4xl font-bold tracking-tight text-paw-950 md:text-5xl">
          Tu tranquilidad, primero
        </h2>
      </div>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {PILLARS.map((pillar) => (
          <div key={pillar.title} className="flex flex-col items-center gap-4 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-paw-100 text-paw-700">
              <pillar.icon className="h-7 w-7" aria-hidden />
            </span>
            <h3 className="font-display text-lg font-bold text-paw-950">{pillar.title}</h3>
            <p className="max-w-xs text-sm leading-relaxed text-ink/70">{pillar.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
