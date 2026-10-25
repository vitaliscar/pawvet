import { describe, expect, it } from 'vitest';
import { computePilotMetrics } from './pilot-metrics.js';

describe('métricas del piloto', () => {
  it('calcula conversión búsqueda→reserva por tutor, cancelación y desglose por vet', () => {
    const m = computePilotMetrics({
      searcherIds: ['u1', 'u1', 'u2', 'u3', 'u4'],
      bookerIds: ['u1', 'u2', 'u9'], // u9 reservó sin búsqueda registrada en la ventana
      appointments: [
        { vet_id: 'v1', vet_name: 'Dra. Rojas', status: 'completed' },
        { vet_id: 'v1', vet_name: 'Dra. Rojas', status: 'cancelled' },
        { vet_id: 'v2', vet_name: 'Dr. Soto', status: 'confirmed' },
        { vet_id: 'v1', vet_name: 'Dra. Rojas', status: 'completed' },
      ],
    });
    expect(m.searchers).toBe(4);
    expect(m.bookers).toBe(2);
    expect(m.search_to_booking_pct).toBe(50);
    expect(m.appointments).toEqual({ total: 4, pending: 0, confirmed: 1, completed: 2, cancelled: 1 });
    expect(m.cancellation_pct).toBe(25);
    expect(m.by_vet[0]).toEqual({ vet_id: 'v1', vet_name: 'Dra. Rojas', total: 3, completed: 2, cancelled: 1 });
  });

  it('sin datos no divide por cero', () => {
    const m = computePilotMetrics({ searcherIds: [], bookerIds: [], appointments: [] });
    expect(m.search_to_booking_pct).toBeNull();
    expect(m.cancellation_pct).toBeNull();
  });
});
