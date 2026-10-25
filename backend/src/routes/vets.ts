import { Hono } from 'hono';
import { z } from 'zod';
import type { RecordModel } from 'pocketbase';
import { audit } from '../lib/audit.js';
import { availableSlots, SLOT_MINUTES, type AvailabilityWindow } from '../lib/booking.js';
import { ensureAdminAuth, pb } from '../lib/pocketbase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const vetRoutes = new Hono();

vetRoutes.use('*', requireAuth);

const RUT_REGEX = /^\d{7,8}-[\dkK]$/;

const vetProfileSchema = z.object({
  full_name: z.string().min(1).max(200),
  rut: z.string().regex(RUT_REGEX, 'RUT inválido (formato 12345678-9)'),
  license_number: z.string().min(1).max(50),
  clinic_name: z.string().max(200).optional(),
  clinic_address: z.string().max(300).optional(),
  clinic_lat: z.number().min(-90).max(90).optional(),
  clinic_lon: z.number().min(-180).max(180).optional(),
  bio: z.string().max(2000).optional(),
  phone: z.string().max(20).optional(),
  offers_home_visits: z.boolean().default(true),
  offers_clinic_visits: z.boolean().default(false),
});

const availabilitySchema = z.object({
  weekday: z.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
  service_type: z.enum(['home_visit', 'clinic_visit']),
  // Heredado: el precio de la cita sale de vet_services (migración 1761264004 lo hizo opcional).
  price_clp: z.number().int().min(0).optional(),
});

const serviceSchema = z.object({
  kind: z.enum(['general_consult', 'vaccination', 'deworming', 'wellness_check']),
  duration_min: z.number().int().min(15).max(SLOT_MINUTES),
  price_clp: z.number().int().min(0),
  home_visit_fee_clp: z.number().int().min(0).default(0),
  active: z.boolean().default(true),
});

const slotsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  service_type: z.enum(['home_visit', 'clinic_visit']).default('home_visit'),
});

// Mi perfil de vet con catálogo completo y disponibilidad (registrar antes de /:id)
vetRoutes.get('/me', requireRole('vet'), async (c) => {
  await ensureAdminAuth();
  let vet;
  try {
    vet = await pb
      .collection('veterinarians')
      .getFirstListItem(pb.filter('user_id = {:userId}', { userId: c.get('user').id }));
  } catch {
    return c.json({ success: false, error: 'Perfil de vet no encontrado' }, 404);
  }
  const byVet = pb.filter('vet_id = {:vetId}', { vetId: vet.id });
  const [services, availability] = await Promise.all([
    pb.collection('vet_services').getFullList({
      filter: byVet,
      fields: 'id,kind,duration_min,price_clp,home_visit_fee_clp,active',
    }),
    pb.collection('vet_availability').getFullList({
      filter: byVet,
      sort: 'weekday,start_time',
      fields: 'weekday,start_time,end_time,service_type',
    }),
  ]);
  return c.json({
    success: true,
    data: {
      id: vet.id,
      full_name: vet.full_name,
      verified: vet.verified,
      clinic_address: vet.clinic_address,
      clinic_lat: vet.clinic_lat,
      clinic_lon: vet.clinic_lon,
      bio: vet.bio,
      phone: vet.phone,
      services,
      availability,
    },
  });
});

// Datos editables por el propio vet sin re-verificación (nunca RUT, licencia ni verified)
const vetSelfUpdateSchema = z
  .object({
    clinic_address: z.string().max(300),
    clinic_lat: z.number().min(-90).max(90),
    clinic_lon: z.number().min(-180).max(180),
    bio: z.string().max(2000),
    phone: z.string().max(20),
  })
  .partial();

vetRoutes.patch('/me', requireRole('vet'), async (c) => {
  const parsed = vetSelfUpdateSchema.strict().safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ success: false, error: 'Datos inválidos', details: parsed.error.flatten() }, 400);
  }
  await ensureAdminAuth();
  let vet;
  try {
    vet = await pb
      .collection('veterinarians')
      .getFirstListItem(pb.filter('user_id = {:userId}', { userId: c.get('user').id }));
  } catch {
    return c.json({ success: false, error: 'Perfil de vet no encontrado' }, 404);
  }
  await pb.collection('veterinarians').update(vet.id, parsed.data);
  await audit(c, { action: 'vet.profile.self_update', resourceType: 'veterinarian', resourceId: vet.id });
  return c.json({ success: true, data: { id: vet.id } });
});

// Perfil público de un vet (verificado)
vetRoutes.get('/:id', async (c) => {
  await ensureAdminAuth();
  let vet;
  try {
    vet = await pb.collection('veterinarians').getOne(c.req.param('id'));
  } catch {
    return c.json({ success: false, error: 'Veterinario no encontrado' }, 404);
  }
  if (!vet.verified) return c.json({ success: false, error: 'Veterinario no encontrado' }, 404);

  const appointments = await pb.collection('appointments').getFullList({
    filter: `vet_id = "${vet.id}" && owner_rating != null`,
    fields: 'owner_rating',
  });
  const rating = appointments.length
    ? Math.round((appointments.reduce((sum, a) => sum + (a.owner_rating ?? 0), 0) / appointments.length) * 10) / 10
    : null;

  const availability = await pb.collection('vet_availability').getFullList({
    filter: `vet_id = "${vet.id}"`,
    fields: 'weekday,start_time,end_time,service_type,price_clp',
  });

  const services = await pb.collection('vet_services').getFullList({
    filter: `vet_id = "${vet.id}" && active = true`,
    fields: 'id,kind,duration_min,price_clp,home_visit_fee_clp',
  });

  return c.json({
    success: true,
    data: {
      id: vet.id,
      full_name: vet.full_name,
      clinic_name: vet.clinic_name,
      clinic_address: vet.clinic_address,
      bio: vet.bio,
      avatar_url: vet.avatar_url,
      offers_home_visits: vet.offers_home_visits,
      offers_clinic_visits: vet.offers_clinic_visits,
      verified: vet.verified,
      rating,
      availability,
      services,
    },
  });
});

// Horarios libres de un vet para una fecha y modalidad
vetRoutes.get('/:id/slots', async (c) => {
  const parsed = slotsQuerySchema.safeParse(c.req.query());
  if (!parsed.success) return c.json({ success: false, error: 'Parámetros inválidos' }, 400);
  const { date, service_type } = parsed.data;
  const vetId = c.req.param('id');

  await ensureAdminAuth();
  const [windows, booked] = await Promise.all([
    pb.collection('vet_availability').getFullList<AvailabilityWindow & RecordModel>({
      filter: pb.filter('vet_id = {:vetId} && service_type = {:service_type}', { vetId, service_type }),
    }),
    pb.collection('appointments').getFullList({
      filter: pb.filter("vet_id = {:vetId} && scheduled_date = {:date} && status != 'cancelled'", {
        vetId,
        date,
      }),
      fields: 'scheduled_time',
    }),
  ]);

  const slots = availableSlots(date, windows, booked.map((a) => a.scheduled_time as string));
  return c.json({ success: true, data: { date, service_type, slot_minutes: SLOT_MINUTES, slots } });
});

// Crear/actualizar mi perfil de vet (queda pending hasta verificación admin)
vetRoutes.put('/me/profile', requireRole('vet'), async (c) => {
  const parsed = vetProfileSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json(
      { success: false, error: 'Datos inválidos', details: parsed.error.flatten() },
      400,
    );
  }

  const userId = c.get('user').id;
  await ensureAdminAuth();
  try {
    let vet;
    try {
      vet = await pb.collection('veterinarians').getFirstListItem(`user_id = "${userId}"`);
      vet = await pb.collection('veterinarians').update(vet.id, parsed.data);
    } catch {
      vet = await pb.collection('veterinarians').create({ ...parsed.data, user_id: userId });
    }
    await audit(c, { action: 'vet.profile.update', resourceType: 'veterinarian', resourceId: vet.id });
    return c.json({ success: true, data: { id: vet.id, verified: vet.verified } });
  } catch (err) {
    console.error('[vets] upsert error:', err);
    return c.json({ success: false, error: 'Error al guardar perfil' }, 500);
  }
});

// Gestionar mi disponibilidad
vetRoutes.put('/me/availability', requireRole('vet'), async (c) => {
  const parsed = z.array(availabilitySchema).max(50).safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json(
      { success: false, error: 'Datos inválidos', details: parsed.error.flatten() },
      400,
    );
  }

  await ensureAdminAuth();
  let vet;
  try {
    vet = await pb.collection('veterinarians').getFirstListItem(`user_id = "${c.get('user').id}"`);
  } catch {
    return c.json({ success: false, error: 'Perfil de vet no encontrado' }, 404);
  }

  // Reemplazo completo de disponibilidad (idempotente)
  const existing = await pb.collection('vet_availability').getFullList({ filter: `vet_id = "${vet.id}"` });
  await Promise.all(existing.map((slot) => pb.collection('vet_availability').delete(slot.id)));
  await Promise.all(
    parsed.data.map((slot) => pb.collection('vet_availability').create({ ...slot, vet_id: vet.id })),
  );

  await audit(c, { action: 'vet.availability.update', resourceType: 'veterinarian', resourceId: vet.id });
  return c.json({ success: true });
});

// Gestionar mi catálogo de servicios (upsert por tipo; índice único vet_id+kind)
vetRoutes.put('/me/services', requireRole('vet'), async (c) => {
  const parsed = z.array(serviceSchema).max(4).safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ success: false, error: 'Datos inválidos', details: parsed.error.flatten() }, 400);
  }

  await ensureAdminAuth();
  let vet;
  try {
    vet = await pb
      .collection('veterinarians')
      .getFirstListItem(pb.filter('user_id = {:userId}', { userId: c.get('user').id }));
  } catch {
    return c.json({ success: false, error: 'Perfil de vet no encontrado' }, 404);
  }

  const existing = await pb.collection('vet_services').getFullList({
    filter: pb.filter('vet_id = {:vetId}', { vetId: vet.id }),
  });
  const byKind = new Map(existing.map((s) => [s.kind as string, s.id]));
  const saved = await Promise.all(
    parsed.data.map((service) => {
      const id = byKind.get(service.kind);
      return id
        ? pb.collection('vet_services').update(id, service)
        : pb.collection('vet_services').create({ ...service, vet_id: vet.id });
    }),
  );

  await audit(c, { action: 'vet.services.update', resourceType: 'veterinarian', resourceId: vet.id });
  return c.json({ success: true, data: saved.map((s) => ({ id: s.id, kind: s.kind, active: s.active })) });
});
