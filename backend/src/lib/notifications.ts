// Plantillas de correo (español de Chile). Funciones puras: sin I/O.
import type { Email } from './email.js';

export interface AppointmentContext {
  ownerEmail: string;
  ownerName: string;
  vetEmail: string;
  vetName: string;
  petName: string;
  serviceKind: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  address: string | null;
  priceClp: number | null;
}

const SERVICE_LABEL: Record<string, string> = {
  general_consult: 'consulta general',
  vaccination: 'vacunación',
  deworming: 'desparasitación',
  wellness_check: 'control preventivo',
};

const formatDate = (date: string): string =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
const formatClp = (v: number | null): string => (v == null ? '—' : `$${v.toLocaleString('es-CL')}`);

function summary(ctx: AppointmentContext): string {
  return [
    `Mascota: ${ctx.petName}`,
    `Servicio: ${SERVICE_LABEL[ctx.serviceKind] ?? ctx.serviceKind}`,
    `Fecha: ${formatDate(ctx.date)} a las ${ctx.time}`,
    ctx.address ? `Dirección: ${ctx.address}` : null,
    `Total a pagar al veterinario: ${formatClp(ctx.priceClp)}`,
  ]
    .filter(Boolean)
    .join('\n');
}

const SIGNATURE = '\n\n— Equipo PAWVET\nhttps://pawvet.net';

export function bookingRequestedEmails(ctx: AppointmentContext): Email[] {
  return [
    {
      to: ctx.ownerEmail,
      subject: `Recibimos tu reserva para ${ctx.petName}`,
      text: `Hola ${ctx.ownerName}:\n\nTu solicitud quedó registrada y ${ctx.vetName} debe confirmarla. Te avisaremos por este medio.\n\n${summary(ctx)}\n\nPuedes cancelar sin costo antes de la hora de inicio desde «Mis citas».${SIGNATURE}`,
    },
    {
      to: ctx.vetEmail,
      subject: `Nueva solicitud de visita: ${formatDate(ctx.date)} ${ctx.time}`,
      text: `Hola ${ctx.vetName}:\n\n${ctx.ownerName} solicitó una visita. Confírmala o cancélala desde tu agenda.\n\n${summary(ctx)}\n\nhttps://pawvet.net/vet${SIGNATURE}`,
    },
  ];
}

export function statusChangedEmails(
  ctx: AppointmentContext,
  status: 'confirmed' | 'completed' | 'cancelled',
  changedBy: 'owner' | 'vet' | 'admin',
  reason?: string,
): Email[] {
  if (status === 'confirmed') {
    return [{
      to: ctx.ownerEmail,
      subject: `${ctx.vetName} confirmó la visita de ${ctx.petName}`,
      text: `Hola ${ctx.ownerName}:\n\nTu visita está confirmada.\n\n${summary(ctx)}\n\nPagas directamente al veterinario al finalizar la atención.${SIGNATURE}`,
    }];
  }
  if (status === 'cancelled') {
    const why = reason ? `\nMotivo: ${reason}` : '';
    const notifyVet = changedBy !== 'vet';
    const notifyOwner = changedBy !== 'owner';
    return [
      ...(notifyOwner
        ? [{
            to: ctx.ownerEmail,
            subject: `Se canceló la visita de ${ctx.petName}`,
            text: `Hola ${ctx.ownerName}:\n\nLa visita del ${formatDate(ctx.date)} a las ${ctx.time} fue cancelada.${why}\n\nPuedes agendar otro horario en https://pawvet.net/reservar${SIGNATURE}`,
          }]
        : []),
      ...(notifyVet
        ? [{
            to: ctx.vetEmail,
            subject: `Cancelación: ${formatDate(ctx.date)} ${ctx.time}`,
            text: `Hola ${ctx.vetName}:\n\n${ctx.ownerName} canceló la visita de ${ctx.petName}.${why}\n\nEl horario volvió a quedar disponible.${SIGNATURE}`,
          }]
        : []),
    ];
  }
  return [];
}

export function reminderEmails(ctx: AppointmentContext): Email[] {
  return [
    {
      to: ctx.ownerEmail,
      subject: `Mañana: visita de ${ctx.vetName} para ${ctx.petName}`,
      text: `Hola ${ctx.ownerName}:\n\nTe recordamos la visita de mañana.\n\n${summary(ctx)}\n\nSi no puedes, cancela desde «Mis citas» para liberar el horario.${SIGNATURE}`,
    },
    {
      to: ctx.vetEmail,
      subject: `Mañana: ${ctx.time} con ${ctx.petName}`,
      text: `Hola ${ctx.vetName}:\n\nRecordatorio de tu visita de mañana.\n\n${summary(ctx)}${SIGNATURE}`,
    },
  ];
}
