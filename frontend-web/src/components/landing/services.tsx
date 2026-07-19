import { Check, Home, Repeat, Stethoscope } from 'lucide-react';

const SERVICES = [
  {
    icon: Home,
    title: 'Visita a domicilio',
    price: 'Desde $25.000',
    unit: 'por visita',
    highlight: true,
    features: [
      'Consulta general y vacunas en tu casa',
      'Sin traslados estresantes',
      'Cobertura según radio del profesional',
    ],
  },
  {
    icon: Stethoscope,
    title: 'Consulta en consultorio',
    price: 'Desde $15.000',
    unit: 'por consulta',
    highlight: false,
    features: [
      'Atención en la clínica del veterinario',
      'Equipamiento completo disponible',
      'Ideal para exámenes y procedimientos',
    ],
  },
  {
    icon: Repeat,
    title: 'Suscripción veterinaria',
    price: 'Desde $12.990',
    unit: 'al mes',
    highlight: false,
    features: [
      'Controles preventivos periódicos',
      'Descuentos en visitas adicionales',
      'Historial de salud siempre al día',
    ],
  },
] as const;

export function Services() {
  return (
    <section id="servicios" className="scroll-mt-20 bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="text-sm font-bold uppercase tracking-widest text-clay-500">
            Servicios
          </span>
          <h2 className="text-balance font-display text-4xl font-bold tracking-tight text-paw-950 md:text-5xl">
            Cuidado a la medida de tu mascota
          </h2>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {SERVICES.map((service) => (
            <div
              key={service.title}
              className={`flex flex-col gap-5 rounded-4xl p-8 ${
                service.highlight
                  ? 'bg-paw-950 text-cream shadow-lifted'
                  : 'border border-paw-100 bg-cream shadow-card'
              }`}
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                  service.highlight ? 'bg-clay-400 text-cream' : 'bg-paw-600 text-cream'
                }`}
              >
                <service.icon className="h-6 w-6" aria-hidden />
              </span>
              <div>
                <h3
                  className={`font-display text-xl font-bold ${
                    service.highlight ? 'text-cream' : 'text-paw-950'
                  }`}
                >
                  {service.title}
                </h3>
                <p className="mt-2 flex items-baseline gap-1.5">
                  <span
                    className={`font-display text-3xl font-bold ${
                      service.highlight ? 'text-cream' : 'text-paw-950'
                    }`}
                  >
                    {service.price}
                  </span>
                  <span className={service.highlight ? 'text-sm text-cream/60' : 'text-sm text-ink/50'}>
                    {service.unit}
                  </span>
                </p>
              </div>
              <ul className="flex flex-col gap-2.5">
                {service.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm leading-relaxed">
                    <Check
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        service.highlight ? 'text-clay-300' : 'text-paw-600'
                      }`}
                      aria-hidden
                    />
                    <span className={service.highlight ? 'text-cream/85' : 'text-ink/70'}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
