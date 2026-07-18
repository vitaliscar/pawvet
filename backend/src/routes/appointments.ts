import { Hono } from 'hono';
import { z } from 'zod';
import { audit } from '../lib/audit.js';
import { decryptNullable, encryptNullable } from '../lib/crypto.js';
import { supabase } from '../lib/supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const appointmentRoutes = new Hono();

appointmentRoutes.use('*', requireAuth);

const createSchema = z.object({
  pet_id: z.string().uuid(),
  vet_id: z.string().uuid(),
  service_type: z.enum(['home_visit', 'clinic_visit']),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scheduled_time: z.string().regex(/^\d{2}:\d{2}$/),
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

/** Perfil (owner o vet) del usuario autenticado. */
async function profileFor(userId: string, role: string) {
  const table = role === 'vet' ? 'veterinarians' : 'pet_owners';
  const { data } = await supabase.from(table).select('id').eq('user_id', userId).single();
  return data?.id ?? null;
}

// Listar citas del usuario (dueño ve las suyas, vet las suyas, admin todas)
appointmentRoutes.get('/', async (c) => {
  const user = c.get('user');
  let query = supabase
    .from('appointments')
    .select(
      'id, pet_id, vet_id, owner_id, service_type, scheduled_date, scheduled_time, price_clp, status, distance_km, owner_rating, created_at',
    )
    .order('scheduled_date', { ascending: false })
    .limit(100);

  if (user.role !== 'admin') {
    const profileId = await profileFor(user.id, user.role);
    if (!profileId) return c.json({ success: false, error: 'Perfil no encontrado' }, 404);
    query = query.eq(user.role === 'vet' ? 'vet_id' : 'owner_id', profileId);
  }

  const { data, error } = await query;
  if (error) return c.json({ success: false, error: 'Error al listar citas' }, 500);
  return c.json({ success: true, data });
});

// Crear cita (solo dueño)
appointmentRoutes.post('/', requireRole('owner'), async (c) => {
  const parsed = createSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json(
      { success: false, error: 'Datos inválidos', details: parsed.error.flatten() },
      400,
    );
  }
  const input = parsed.data;
  const ownerId = await profileFor(c.get('user').id, 'owner');
  if (!ownerId) return c.json({ success: false, error: 'Perfil de dueño no encontrado' }, 404);

  // La mascota debe pertenecer al dueño
  const { data: pet } = await supabase
    .from('pets')
    .select('id')
    .eq('id', input.pet_id)
    .eq('owner_id', ownerId)
    .single();
  if (!pet) return c.json({ success: false, error: 'Mascota no encontrada' }, 404);

  // El vet debe estar verificado y con suscripción activa
  const { data: vet } = await supabase
    .from('veterinarians')
    .select('id, verified, subscription_status')
    .eq('id', input.vet_id)
    .single();
  if (!vet?.verified || vet.subscription_status !== 'active') {
    return c.json({ success: false, error: 'Veterinario no disponible' }, 422);
  }

  const location =
    input.lat !== undefined && input.lon !== undefined
      ? `SRID=4326;POINT(${input.lon} ${input.lat})`
      : null;

  const { data, error } = await supabase
    .from('appointments')
    .insert({
      pet_id: input.pet_id,
      vet_id: input.vet_id,
      owner_id: ownerId,
      service_type: input.service_type,
      scheduled_date: input.scheduled_date,
      scheduled_time: input.scheduled_time,
      service_location: location,
      status: 'pending',
    })
    .select('id, status, scheduled_date, scheduled_time')
    .single();

  if (error) return c.json({ success: false, error: 'Error al crear cita' }, 500);

  await audit(c, { action: 'appointment.create', resourceType: 'appointment', resourceId: data.id });
  return c.json({ success: true, data }, 201);
});

// Cambiar estado (vet confirma/completa/cancela; dueño cancela)
appointmentRoutes.patch('/:id/status', async (c) => {
  const statusSchema = z.object({
    status: z.enum(['confirmed', 'completed', 'cancelled']),
  });
  const parsed = statusSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ success: false, error: 'Estado inválido' }, 400);

  const user = c.get('user');
  const allowed: Record<string, string[]> = {
    owner: ['cancelled'],
    vet: ['confirmed', 'completed', 'cancelled'],
    admin: ['confirmed', 'completed', 'cancelled'],
  };
  if (!allowed[user.role]?.includes(parsed.data.status)) {
    return c.json({ success: false, error: 'Transición no permitida para tu rol' }, 403);
  }

  let query = supabase
    .from('appointments')
    .update({ status: parsed.data.status })
    .eq('id', c.req.param('id'));

  if (user.role !== 'admin') {
    const profileId = await profileFor(user.id, user.role);
    if (!profileId) return c.json({ success: false, error: 'Perfil no encontrado' }, 404);
    query = query.eq(user.role === 'vet' ? 'vet_id' : 'owner_id', profileId);
  }

  const { data, error } = await query.select('id, status').single();
  if (error || !data) return c.json({ success: false, error: 'Cita no encontrada' }, 404);

  await audit(c, {
    action: `appointment.${parsed.data.status}`,
    resourceType: 'appointment',
    resourceId: data.id,
  });
  return c.json({ success: true, data });
});

// Notas médicas (solo vet asignado) — encriptadas AES-256-GCM
appointmentRoutes.put('/:id/medical-notes', requireRole('vet'), async (c) => {
  const parsed = medicalNotesSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json(
      { success: false, error: 'Datos inválidos', details: parsed.error.flatten() },
      400,
    );
  }
  const vetId = await profileFor(c.get('user').id, 'vet');
  if (!vetId) return c.json({ success: false, error: 'Perfil de vet no encontrado' }, 404);

  const { vet_notes, diagnosis, treatment, medications, follow_up_required } = parsed.data;
  const { data, error } = await supabase
    .from('appointments')
    .update({
      vet_notes_enc: encryptNullable(vet_notes),
      diagnosis_enc: encryptNullable(diagnosis),
      treatment_enc: encryptNullable(treatment),
      medications_enc: encryptNullable(medications),
      follow_up_required: follow_up_required ?? null,
    })
    .eq('id', c.req.param('id'))
    .eq('vet_id', vetId)
    .select('id')
    .single();

  if (error || !data) return c.json({ success: false, error: 'Cita no encontrada' }, 404);

  await audit(c, {
    action: 'appointment.medical_notes.update',
    resourceType: 'appointment',
    resourceId: data.id,
  });
  return c.json({ success: true, data });
});

// Leer notas médicas (vet asignado o dueño de la mascota)
appointmentRoutes.get('/:id/medical-notes', async (c) => {
  const user = c.get('user');
  let query = supabase
    .from('appointments')
    .select('id, vet_notes_enc, diagnosis_enc, treatment_enc, medications_enc, follow_up_required')
    .eq('id', c.req.param('id'));

  if (user.role !== 'admin') {
    const profileId = await profileFor(user.id, user.role);
    if (!profileId) return c.json({ success: false, error: 'Perfil no encontrado' }, 404);
    query = query.eq(user.role === 'vet' ? 'vet_id' : 'owner_id', profileId);
  }

  const { data, error } = await query.single();
  if (error || !data) return c.json({ success: false, error: 'Cita no encontrada' }, 404);

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
