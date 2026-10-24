import { describe, expect, it } from 'vitest';
import {
  availableSlots,
  canTransition,
  isFutureSlot,
  nowInChile,
  slotsForDate,
  totalPriceClp,
  weekdayOf,
} from './booking.js';

const MONDAY = '2030-01-07';
const windows = [
  { weekday: 1, start_time: '09:00', end_time: '12:30' },
  { weekday: 1, start_time: '15:00', end_time: '17:00' },
  { weekday: 6, start_time: '10:00', end_time: '12:00' },
];

describe('booking', () => {
  it('calcula el día de la semana de una fecha calendario', () => {
    expect(weekdayOf(MONDAY)).toBe(1);
    expect(weekdayOf('2030-01-06')).toBe(0);
  });

  it('genera solo bloques completos de 60 min dentro de las ventanas del día', () => {
    expect(slotsForDate(MONDAY, windows)).toEqual(['09:00', '10:00', '11:00', '15:00', '16:00']);
    expect(slotsForDate('2030-01-08', windows)).toEqual([]);
  });

  it('excluye horarios tomados y pasados', () => {
    const now = new Date('2030-01-07T13:30:00Z'); // 10:30 en Chile (UTC-3 en verano)
    expect(availableSlots(MONDAY, windows, ['15:00'], now)).toEqual(['11:00', '16:00']);
  });

  it('usa la hora de Chile para decidir si un horario ya pasó', () => {
    const now = new Date('2030-01-07T12:00:00Z'); // 09:00 en Chile
    expect(nowInChile(now)).toBe('2030-01-07 09:00');
    expect(isFutureSlot(MONDAY, '09:00', now)).toBe(false);
    expect(isFutureSlot(MONDAY, '10:00', now)).toBe(true);
  });

  it('permite solo transiciones válidas por rol', () => {
    expect(canTransition('pending', 'confirmed', 'vet')).toBe(true);
    expect(canTransition('pending', 'confirmed', 'owner')).toBe(false);
    expect(canTransition('confirmed', 'cancelled', 'owner')).toBe(true);
    expect(canTransition('confirmed', 'completed', 'vet')).toBe(true);
    expect(canTransition('pending', 'completed', 'vet')).toBe(false);
    expect(canTransition('completed', 'cancelled', 'admin')).toBe(false);
    expect(canTransition('cancelled', 'confirmed', 'admin')).toBe(false);
  });

  it('suma el recargo de traslado solo en visitas a domicilio', () => {
    const service = { price_clp: 30000, home_visit_fee_clp: 5000 };
    expect(totalPriceClp(service, 'home_visit')).toBe(35000);
    expect(totalPriceClp(service, 'clinic_visit')).toBe(30000);
    expect(totalPriceClp({ price_clp: 20000 }, 'home_visit')).toBe(20000);
  });
});
