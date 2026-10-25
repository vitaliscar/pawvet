// Formatos y alcance del piloto (mismo contenido que frontend-web/src/lib/pilot.ts y labels.ts).

export const PILOT_COMMUNES = [
  { name: 'Providencia', lat: -33.4314, lon: -70.6093 },
  { name: 'Ñuñoa', lat: -33.4569, lon: -70.5979 },
] as const;

export const SERVICE_LABEL: Record<string, string> = {
  general_consult: 'Consulta general',
  vaccination: 'Vacunación',
  deworming: 'Desparasitación',
  wellness_check: 'Control preventivo',
};

export const STATUS_LABEL: Record<string, string> = {
  pending: 'Por confirmar',
  confirmed: 'Confirmada',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const DAY_MS = 86_400_000;

// Formateo manual: Hermes no garantiza Intl con locales es-CL en todos los dispositivos.
export const formatClp = (v: number | null | undefined): string =>
  v == null ? '—' : `$${Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

export function formatDate(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

/** Próximos días calendario según la zona horaria del dispositivo. */
export function upcomingDates(days = 14): string[] {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  const base = Date.parse(`${local.toISOString().slice(0, 10)}T12:00:00Z`);
  return Array.from({ length: days }, (_, i) => new Date(base + i * DAY_MS).toISOString().slice(0, 10));
}

/** Clave de idempotencia por intento de reserva (Hermes no expone crypto.randomUUID). */
export const newIdempotencyKey = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
