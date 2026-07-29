import { Hono } from 'hono';
import { z } from 'zod';
import { audit } from '../lib/audit.js';
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
  price_clp: z.number().int().min(0),
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
    },
  });
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
