// Reglas puras del motor de citas (sin I/O): estados, grilla de horarios y precio.

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type Role = 'owner' | 'vet' | 'admin';
export type ServiceType = 'home_visit' | 'clinic_visit';

// ponytail: grilla fija de 60 min por cita (servicio + traslado). Servicios más
// largos o traslados variables requieren reservar bloques contiguos.
export const SLOT_MINUTES = 60;
export const TIME_ZONE = 'America/Santiago';

const TRANSITIONS: Record<AppointmentStatus, Partial<Record<AppointmentStatus, Role[]>>> = {
  pending: { confirmed: ['vet', 'admin'], cancelled: ['owner', 'vet', 'admin'] },
  confirmed: { completed: ['vet', 'admin'], cancelled: ['owner', 'vet', 'admin'] },
  completed: {},
  cancelled: {},
};

export function canTransition(from: AppointmentStatus, to: AppointmentStatus, role: Role): boolean {
  return TRANSITIONS[from][to]?.includes(role) ?? false;
}

export interface AvailabilityWindow {
  weekday: number; // 0 = domingo
  start_time: string; // HH:MM
  end_time: string; // HH:MM
}

const toMinutes = (hhmm: string): number => {
  const [h = 0, m = 0] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const toHHMM = (minutes: number): string =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

/** Día de la semana (0 = domingo) de una fecha calendario YYYY-MM-DD. */
export function weekdayOf(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

/** Horarios de inicio de la grilla que caben completos en las ventanas del día. */
export function slotsForDate(date: string, windows: AvailabilityWindow[]): string[] {
  const weekday = weekdayOf(date);
  const slots = new Set<string>();
  for (const w of windows.filter((x) => x.weekday === weekday)) {
    const end = toMinutes(w.end_time);
    for (let t = toMinutes(w.start_time); t + SLOT_MINUTES <= end; t += SLOT_MINUTES) {
      slots.add(toHHMM(t));
    }
  }
  return [...slots].sort();
}

/** Fecha y hora actual en Chile como 'YYYY-MM-DD HH:MM' (comparable como texto). */
export function nowInChile(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(now);
}

export function isFutureSlot(date: string, time: string, now: Date = new Date()): boolean {
  return `${date} ${time}` > nowInChile(now);
}

/** Horarios libres: en grilla, no tomados y aún no comenzados. */
export function availableSlots(
  date: string,
  windows: AvailabilityWindow[],
  taken: string[],
  now: Date = new Date(),
): string[] {
  const takenSet = new Set(taken);
  return slotsForDate(date, windows).filter((t) => !takenSet.has(t) && isFutureSlot(date, t, now));
}

export interface PricedService {
  price_clp: number;
  home_visit_fee_clp?: number | null;
}

/** Precio final en CLP: servicio + recargo de traslado si es a domicilio. */
export function totalPriceClp(service: PricedService, serviceType: ServiceType): number {
  const fee = serviceType === 'home_visit' ? (service.home_visit_fee_clp ?? 0) : 0;
  return service.price_clp + fee;
}
