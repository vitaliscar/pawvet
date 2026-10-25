import type { RecordModel } from 'pocketbase';
import { nowInChile } from './booking.js';
import { sendEmails, type Email } from './email.js';
import {
  bookingRequestedEmails,
  reminderEmails,
  statusChangedEmails,
  type AppointmentContext,
} from './notifications.js';
import { ensureAdminAuth, pb } from './pocketbase.js';

const EXPAND = 'pet_id,service_id,owner_id.user_id,vet_id.user_id';
const REMINDER_INTERVAL_MS = 30 * 60_000;
const DAY_MS = 86_400_000;

function toContext(a: RecordModel): AppointmentContext {
  const e = a.expand ?? {};
  return {
    ownerEmail: e.owner_id?.expand?.user_id?.email ?? '',
    ownerName: e.owner_id?.full_name ?? 'tutor',
    vetEmail: e.vet_id?.expand?.user_id?.email ?? '',
    vetName: e.vet_id?.full_name ?? 'tu veterinario',
    petName: e.pet_id?.name ?? 'tu mascota',
    serviceKind: e.service_id?.kind ?? '',
    date: a.scheduled_date,
    time: a.scheduled_time,
    address: e.owner_id?.address ?? null,
    priceClp: a.price_clp ?? null,
  };
}

/** Carga la cita con sus relaciones y envía los correos que construya `build`.
 *  Nunca lanza: las notificaciones no deben romper el flujo de reserva. */
async function notify(appointmentId: string, build: (ctx: AppointmentContext) => Email[]): Promise<void> {
  try {
    await ensureAdminAuth();
    const appointment = await pb.collection('appointments').getOne(appointmentId, { expand: EXPAND });
    await sendEmails(build(toContext(appointment)).filter((m) => m.to));
  } catch (err) {
    console.error('[notify] no se pudo notificar la cita', appointmentId, err);
  }
}

export const notifyBookingRequested = (id: string) => notify(id, bookingRequestedEmails);

export const notifyStatusChanged = (
  id: string,
  status: 'confirmed' | 'completed' | 'cancelled',
  by: 'owner' | 'vet' | 'admin',
  reason?: string,
) => notify(id, (ctx) => statusChangedEmails(ctx, status, by, reason));

/** Recordatorio a tutor y vet el día anterior a cada cita confirmada (una sola vez). */
export async function sendDueReminders(now: Date = new Date()): Promise<number> {
  const today = nowInChile(now).slice(0, 10);
  const tomorrow = new Date(Date.parse(`${today}T12:00:00Z`) + DAY_MS).toISOString().slice(0, 10);
  await ensureAdminAuth();
  const due = await pb.collection('appointments').getFullList({
    filter: pb.filter("status = 'confirmed' && scheduled_date = {:tomorrow} && reminder_sent_at = ''", { tomorrow }),
    expand: EXPAND,
  });
  for (const appointment of due) {
    await sendEmails(reminderEmails(toContext(appointment)).filter((m) => m.to));
    await pb.collection('appointments').update(appointment.id, { reminder_sent_at: new Date().toISOString() });
  }
  return due.length;
}

// ponytail: intervalo en memoria, correcto con una sola instancia de la API.
// Con varias instancias, mover a un cron de PocketBase o a una cola.
export function startReminderLoop(): void {
  const run = () => sendDueReminders().catch((err) => console.error('[reminders] fallo en el ciclo:', err));
  void run();
  setInterval(run, REMINDER_INTERVAL_MS).unref();
}
