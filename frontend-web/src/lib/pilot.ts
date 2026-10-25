// Alcance del piloto (docs/PILOTO.md). Coordenadas aproximadas del centro de
// cada comuna: alternativa cuando el tutor no comparte su ubicación.
export const PILOT_COMMUNES = [
  { name: 'Providencia', lat: -33.4314, lon: -70.6093 },
  { name: 'Ñuñoa', lat: -33.4569, lon: -70.5979 },
] as const;

export type PilotCommune = (typeof PILOT_COMMUNES)[number]['name'];

export const SEARCH_RADIUS_KM = 10;

export const BOOKING_TERMS = [
  'Pagas la atención directamente al veterinario al finalizar la visita. PAWVET no cobra en el piloto.',
  'Puedes cancelar sin costo antes de la hora de inicio desde «Mis citas».',
  'Todos los veterinarios fueron verificados por PAWVET (RUT y título profesional).',
  'Tus datos clínicos se guardan cifrados y solo los ve el veterinario que atiende.',
] as const;
