// Etiquetas de cara al usuario (español de Chile) para valores de la API.

export type ServiceKind = 'general_consult' | 'vaccination' | 'deworming' | 'wellness_check';
export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export const SERVICE_KIND_LABEL: Record<ServiceKind, string> = {
  general_consult: 'Consulta general',
  vaccination: 'Vacunación',
  deworming: 'Desparasitación',
  wellness_check: 'Control preventivo',
};

export const SERVICE_KINDS = Object.keys(SERVICE_KIND_LABEL) as ServiceKind[];

export const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: 'Por confirmar',
  confirmed: 'Confirmada',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

export const WEEKDAY_LABEL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const formatClp = (value: number | null | undefined): string =>
  value == null ? '—' : `$${value.toLocaleString('es-CL')}`;

/** 'YYYY-MM-DD' → 'lunes 7 de enero' sin desfase de zona horaria. */
export function formatDate(date: string): string {
  const text = new Date(`${date}T12:00:00Z`).toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
  // Solo la primera letra: en español los meses van en minúscula.
  return text.charAt(0).toUpperCase() + text.slice(1);
}
