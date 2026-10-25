import { describe, expect, it } from 'vitest';
import { bookingRequestedEmails, reminderEmails, statusChangedEmails, type AppointmentContext } from './notifications.js';

const ctx: AppointmentContext = {
  ownerEmail: 'tutora@example.cl',
  ownerName: 'Javiera',
  vetEmail: 'vet@example.cl',
  vetName: 'Dra. Rojas',
  petName: 'Mostaza',
  serviceKind: 'vaccination',
  date: '2030-01-07',
  time: '11:00',
  address: 'Av. Grecia 1800, Ñuñoa',
  priceClp: 22000,
};

describe('notificaciones de citas', () => {
  it('al reservar avisa al tutor y al vet con precio, fecha y servicio', () => {
    const [toOwner, toVet] = bookingRequestedEmails(ctx);
    expect(toOwner?.to).toBe(ctx.ownerEmail);
    expect(toVet?.to).toBe(ctx.vetEmail);
    expect(toOwner?.text).toContain('$22.000');
    expect(toOwner?.text).toContain('vacunación');
    expect(toVet?.subject).toContain('lunes, 7 de enero');
  });

  it('la confirmación solo va al tutor', () => {
    const emails = statusChangedEmails(ctx, 'confirmed', 'vet');
    expect(emails.map((e) => e.to)).toEqual([ctx.ownerEmail]);
  });

  it('la cancelación avisa a la otra parte, con motivo', () => {
    expect(statusChangedEmails(ctx, 'cancelled', 'owner').map((e) => e.to)).toEqual([ctx.vetEmail]);
    const byVet = statusChangedEmails(ctx, 'cancelled', 'vet', 'Emergencia');
    expect(byVet.map((e) => e.to)).toEqual([ctx.ownerEmail]);
    expect(byVet[0]?.text).toContain('Motivo: Emergencia');
    expect(statusChangedEmails(ctx, 'cancelled', 'admin').map((e) => e.to)).toEqual([ctx.ownerEmail, ctx.vetEmail]);
  });

  it('completar una cita no envía correos; el recordatorio va a ambos', () => {
    expect(statusChangedEmails(ctx, 'completed', 'vet')).toEqual([]);
    expect(reminderEmails(ctx).map((e) => e.to)).toEqual([ctx.ownerEmail, ctx.vetEmail]);
  });
});
