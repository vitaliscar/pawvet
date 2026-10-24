import { Hono } from 'hono';
import { ClientResponseError, type RecordModel } from 'pocketbase';
import { z } from 'zod';
import { audit } from '../lib/audit.js';
import {
  canTransition,
  isFutureSlot,
  slotsForDate,
  totalPriceClp,
  type AppointmentStatus,
  type AvailabilityWindow,
} from '../lib/booking.js';
import { decryptNullable, encryptNullable } from '../lib/crypto.js';
import { haversineKm } from '../lib/geo.js';
import { ensureAdminAuth, pb } from '../lib/pocketbase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const appointmentRoutes = new Hono();

appointmentRoutes.use('*', requireAuth);

const createSchema = z.object({
  pet_id: z.string().min(1),
  vet_id: z.string().min(1),
  service_id: z.string().min(1),
  service_type: z.enum(['home_visit', 'clinic_visit']),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scheduled_time: z.string().regex(/^\d{2}:\d{2}$/),
  // Generada por el cliente una vez por intento de reserva; reintentos la repiten.
  idempotency_key: z.string().min(8).max(100),
  lat: z.number().min(-90).max(90).optional(),
  lon: z.number().min(-180).max(180).optional(),
});

const medicalNotesSchema = z.object({
  vet_notes: z.string().max(20_000).optional(),
  diagnosis: z.string().max(20_000).optional(),
  treatment: z.string().max(20_000).optional(),
  medications: z.string().max(20_000).optional(),
  follow_up_required: z.boolean().optional(),
});

type CreateInput = z.infer<typeof createSchema>;

/** Perfil (owner o vet) del usuario autenticado. */
async function profileFor(userId: string, role: string): Promise<string | null> {
  const collection = role === 'vet' ? 'veterinarians' : 'pet_owners';
  await ensureAdminAuth();
  try {
    const record = await pb
      .collection(collection)
      .getFirstListItem(pb.filter('user_id = {:userId}', { userId }));
    return record.id;
  } catch {
    return null;
  }
}

async function getOrNull(collection: string, id: string): Promise<RecordModel | null> {
  try {
    return await pb.collection(collection).getOne(id);
  } catch {
    return null;
  }
}

async function findByIdempotencyKey(ownerId: string, key: string): Promise<RecordModel | null> {
  try {
    return await pb
      .collection('appointments')
      .getFirstListItem(pb.filter('owner_id = {:ownerId} && idempotency_key = {:key}', { ownerId, key }));
  } catch {
    return null;
  }
}

function isUniqueViolation(err: unknown): boolean {
  return (
    err instanceof ClientResponseError &&
    err.status === 400 &&
    JSON.stringify(err.response?.data ?? {}).includes('validation_not_unique')
  );
}

const summarize = (a: RecordModel) => ({
  id: a.id,
  status: a.status,
  scheduled_date: a.scheduled_date,
  scheduled_time: a.scheduled_time,
  price_clp: a.price_clp,
});

type BookingCheck = { error: string; status: 404 | 422 } | { vet: RecordModel; service: RecordModel };

/** Valida mascota, vet, servicio y horario antes de intentar crear la cita. */
async function validateBooking(input: CreateInput, ownerId: string): Promise<BookingCheck> {
  const pet = await getOrNull('pets', input.pet_id);
  if (!pet || pet.owner_id !== ownerId) return { error: 'Mascota no encontrada', status: 404 };

  const vet = await getOrNull('veterinarians', input.vet_id);
  if (!vet?.verified) return { error: 'Veterinario no disponible', status: 422 };

  const service = await getOrNull('vet_services', input.service_id);
  if (!service || service.vet_id !== vet.id || !service.active) {
    return { error: 'Servicio no disponible', status: 422 };
  }

  const windows = await pb.collection('vet_availability').getFullList<AvailabilityWindow & RecordModel>({
    filter: pb.filter('vet_id = {:vetId} && service_type = {:type}', {
      vetId: vet.id,
      type: input.service_type,
    }),
  });
  const onGrid = slotsForDate(input.scheduled_date, windows).includes(input.scheduled_time);
  if (!onGrid || !isFutureSlot(input.scheduled_date, input.scheduled_time)) {
    return { error: 'Horario fuera de la disponibilidad del veterinario', status: 422 };
  }
  return { vet, service };
}

function distanceKm(input: CreateInput, vet: RecordModel): number | null {
  if (input.lat == null || input.lon == null || vet.clinic_lat == null || vet.clinic_lon == null) {
    return null;
  }
  return Math.round(haversineKm(input.lat, input.lon, vet.clinic_lat, vet.clinic_lon) * 100) / 100;
}

// Listar citas del usuario (dueño ve las suyas, vet las suyas, admin todas)
appointmentRoutes.get('/', async (c) => {
  const user = c.get('user');
  await ensureAdminAuth();

  let filter = '';
  if (user.role !== 'admin') {
    const profileId = await profileFor(user.id, user.role);
    if (!profileId) return c.json({ success: false, error: 'Perfil no encontrado' }, 404);
    const field = user.role === 'vet' ? 'vet_id' : 'owner_id';
    filter = pb.filter(`${field} = {:profileId}`, { profileId });
  }

  const data = await pb.collection('appointments').getList(1, 100, {
    filter,
    sort: '-scheduled_date,-scheduled_time',
    expand: 'pet_id,service_id,owner_id,vet_id',
    fields: [
      'id,pet_id,vet_id,owner_id,service_id,service_type,scheduled_date,scheduled_time',
      'price_clp,status,distance_km,owner_rating,cancel_reason,created',
      'expand.pet_id.name,expand.pet_id.species,expand.service_id.kind',
      'expand.owner_id.full_name,expand.owner_id.address,expand.vet_id.full_name',
    ].join(','),
    requestKey: null,
  });

  // Aplana las relaciones; la dirección solo se entrega a quien atiende o administra.
  const items = data.items.map(({ expand, ...a }) => ({
    ...a,
    pet_name: expand?.pet_id?.name ?? null,
    pet_species: expand?.pet_id?.species ?? null,
    service_kind: expand?.service_id?.kind ?? null,
    owner_name: expand?.owner_id?.full_name ?? null,
    address: user.role === 'owner' ? null : (expand?.owner_id?.address ?? null),
    vet_name: expand?.vet_id?.full_name ?? null,
  }));
  return c.json({ success: true, data: items });
});

// Crear cita (solo dueño). El índice único (vet, fecha, hora) de PocketBase
// garantiza que dos solicitudes simultáneas no tomen el mismo cupo.
appointmentRoutes.post('/', requireRole('owner'), async (c) => {
  const parsed = createSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ success: false, error: 'Datos inválidos', details: parsed.error.flatten() }, 400);
  }
  const input = parsed.data;
  const ownerId = await profileFor(c.get('user').id, 'owner');
  if (!ownerId) return c.json({ success: false, error: 'Perfil de dueño no encontrado' }, 404);

  const previous = await findByIdempotencyKey(ownerId, input.idempotency_key);
  if (previous) return c.json({ success: true, data: summarize(previous) }, 200);

  const check = await validateBooking(input, ownerId);
  if ('error' in check) return c.json({ success: false, error: check.error }, check.status);

  try {
    const data = await pb.collection('appointments').create({
      pet_id: input.pet_id,
      vet_id: input.vet_id,
      owner_id: ownerId,
      service_id: input.service_id,
      service_type: input.service_type,
      scheduled_date: input.scheduled_date,
      scheduled_time: input.scheduled_time,
      service_lat: input.lat ?? null,
      service_lon: input.lon ?? null,
      distance_km: distanceKm(input, check.vet),
      price_clp: totalPriceClp(
        { price_clp: check.service.price_clp, home_visit_fee_clp: check.service.home_visit_fee_clp },
        input.service_type,
      ),
      idempotency_key: input.idempotency_key,
      status: 'pending',
    });
    await audit(c, { action: 'appointment.create', resourceType: 'appointment', resourceId: data.id });
    return c.json({ success: true, data: summarize(data) }, 201);
  } catch (err) {
    // Carrera resuelta por el índice: o fue un reintento concurrente, o el cupo ya se tomó.
    const raced = await findByIdempotencyKey(ownerId, input.idempotency_key);
    if (raced) return c.json({ success: true, data: summarize(raced) }, 200);
    if (isUniqueViolation(err)) {
      return c.json({ success: false, error: 'Ese horario ya fue reservado. Elige otro.' }, 409);
    }
    console.error('[appointments] create error:', err);
    return c.json({ success: false, error: 'Error al crear cita' }, 500);
  }
});

// Cambiar estado según la máquina de estados de lib/booking.ts
appointmentRoutes.patch('/:id/status', async (c) => {
  const statusSchema = z.object({
    status: z.enum(['confirmed', 'completed', 'cancelled']),
    cancel_reason: z.string().max(500).optional(),
  });
  const parsed = statusSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ success: false, error: 'Estado inválido' }, 400);

  const user = c.get('user');
  await ensureAdminAuth();
  const existing = await getOrNull('appointments', c.req.param('id'));
  if (!existing) return c.json({ success: false, error: 'Cita no encontrada' }, 404);

  if (user.role !== 'admin') {
    const profileId = await profileFor(user.id, user.role);
    const field = user.role === 'vet' ? 'vet_id' : 'owner_id';
    if (!profileId || existing[field] !== profileId) {
      return c.json({ success: false, error: 'Cita no encontrada' }, 404);
    }
  }

  const next = parsed.data.status;
  if (!canTransition(existing.status as AppointmentStatus, next, user.role)) {
    return c.json({ success: false, error: 'Cambio de estado no permitido' }, 409);
  }
  if (user.role === 'owner' && !isFutureSlot(existing.scheduled_date, existing.scheduled_time)) {
    return c.json({ success: false, error: 'La cita ya comenzó; contacta al veterinario' }, 409);
  }

  const data = await pb.collection('appointments').update(existing.id, {
    status: next,
    ...(next === 'cancelled' ? { cancel_reason: parsed.data.cancel_reason ?? '' } : {}),
  });
  await audit(c, { action: `appointment.${next}`, resourceType: 'appointment', resourceId: data.id });
  return c.json({ success: true, data: { id: data.id, status: data.status } });
});

// Notas médicas (solo vet asignado) — encriptadas AES-256-GCM
appointmentRoutes.put('/:id/medical-notes', requireRole('vet'), async (c) => {
  const parsed = medicalNotesSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ success: false, error: 'Datos inválidos', details: parsed.error.flatten() }, 400);
  }
  const vetId = await profileFor(c.get('user').id, 'vet');
  if (!vetId) return c.json({ success: false, error: 'Perfil de vet no encontrado' }, 404);

  await ensureAdminAuth();
  const existing = await getOrNull('appointments', c.req.param('id') ?? '');
  if (!existing || existing.vet_id !== vetId) {
    return c.json({ success: false, error: 'Cita no encontrada' }, 404);
  }

  const { vet_notes, diagnosis, treatment, medications, follow_up_required } = parsed.data;
  const data = await pb.collection('appointments').update(existing.id, {
    vet_notes_enc: encryptNullable(vet_notes),
    diagnosis_enc: encryptNullable(diagnosis),
    treatment_enc: encryptNullable(treatment),
    medications_enc: encryptNullable(medications),
    follow_up_required: follow_up_required ?? null,
  });

  await audit(c, {
    action: 'appointment.medical_notes.update',
    resourceType: 'appointment',
    resourceId: data.id,
  });
  return c.json({ success: true, data: { id: data.id } });
});

// Leer notas médicas (vet asignado o dueño de la mascota)
appointmentRoutes.get('/:id/medical-notes', async (c) => {
  const user = c.get('user');
  await ensureAdminAuth();
  const data = await getOrNull('appointments', c.req.param('id'));
  if (!data) return c.json({ success: false, error: 'Cita no encontrada' }, 404);

  if (user.role !== 'admin') {
    const profileId = await profileFor(user.id, user.role);
    const field = user.role === 'vet' ? 'vet_id' : 'owner_id';
    if (!profileId || data[field] !== profileId) {
      return c.json({ success: false, error: 'Cita no encontrada' }, 404);
    }
  }

  await audit(c, {
    action: 'appointment.medical_notes.view',
    resourceType: 'appointment',
    resourceId: data.id,
  });

  return c.json({
    success: true,
    data: {
      id: data.id,
      vet_notes: decryptNullable(data.vet_notes_enc),
      diagnosis: decryptNullable(data.diagnosis_enc),
      treatment: decryptNullable(data.treatment_enc),
      medications: decryptNullable(data.medications_enc),
      follow_up_required: data.follow_up_required,
    },
  });
});
