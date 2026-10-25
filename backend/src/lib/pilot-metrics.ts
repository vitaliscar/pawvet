// Métricas del piloto (docs/PILOTO.md, sección Medición). Función pura: sin I/O.

export interface PilotAppointment {
  vet_id: string;
  vet_name: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

export interface PilotInput {
  searcherIds: string[]; // user_id de cada búsqueda (audit search.vets)
  bookerIds: string[]; // user_id de cada reserva creada (audit appointment.create)
  appointments: PilotAppointment[];
}

const percent = (part: number, whole: number): number | null =>
  whole === 0 ? null : Math.round((part / whole) * 1000) / 10;

export function computePilotMetrics({ searcherIds, bookerIds, appointments }: PilotInput) {
  const searchers = new Set(searcherIds);
  const convertedBookers = new Set(bookerIds.filter((id) => searchers.has(id)));

  const totals = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
  const byVet = new Map<string, { vet_id: string; vet_name: string; total: number; completed: number; cancelled: number }>();
  for (const a of appointments) {
    totals[a.status] += 1;
    const row = byVet.get(a.vet_id) ?? { vet_id: a.vet_id, vet_name: a.vet_name, total: 0, completed: 0, cancelled: 0 };
    row.total += 1;
    if (a.status === 'completed') row.completed += 1;
    if (a.status === 'cancelled') row.cancelled += 1;
    byVet.set(a.vet_id, row);
  }

  return {
    searchers: searchers.size,
    bookers: convertedBookers.size,
    search_to_booking_pct: percent(convertedBookers.size, searchers.size),
    appointments: { total: appointments.length, ...totals },
    cancellation_pct: percent(totals.cancelled, appointments.length),
    by_vet: [...byVet.values()].sort((a, b) => b.total - a.total),
  };
}
