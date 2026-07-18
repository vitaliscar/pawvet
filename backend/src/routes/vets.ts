import { Hono } from 'hono';
import { z } from 'zod';
import { audit } from '../lib/audit.js';
import { supabase } from '../lib/supabase.js';
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
  const { data, error } = await supabase
    .from('veterinarians')
    .select(
      'id, full_name, clinic_name, clinic_address, bio, avatar_url, offers_home_visits, offers_clinic_visits, verified',
    )
    .eq('id', c.req.param('id'))
    .eq('verified', true)
    .single();

  if (error || !data) return c.json({ success: false, error: 'Veterinario no encontrado' }, 404);

  const { data: rating } = await supabase.rpc('vet_average_rating', { p_vet_id: data.id });
  const { data: availability } = await supabase
    .from('vet_availability')
    .select('weekday, start_time, end_time, service_type, price_clp')
    .eq('vet_id', data.id);

  return c.json({ success: true, data: { ...data, rating, availability: availability ?? [] } });
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
  const { clinic_lat, clinic_lon, ...fields } = parsed.data;
  const location =
    clinic_lat !== undefined && clinic_lon !== undefined
      ? `SRID=4326;POINT(${clinic_lon} ${clinic_lat})`
      : null;

  const userId = c.get('user').id;
  const { data, error } = await supabase
    .from('veterinarians')
    .upsert(
      { ...fields, user_id: userId, clinic_location: location },
      { onConflict: 'user_id' },
    )
    .select('id, verified')
    .single();

  if (error) {
    console.error('[vets] upsert error:', error.message);
    return c.json({ success: false, error: 'Error al guardar perfil' }, 500);
  }

  await audit(c, { action: 'vet.profile.update', resourceType: 'veterinarian', resourceId: data.id });
  return c.json({ success: true, data });
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

  const { data: vet } = await supabase
    .from('veterinarians')
    .select('id')
    .eq('user_id', c.get('user').id)
    .single();
  if (!vet) return c.json({ success: false, error: 'Perfil de vet no encontrado' }, 404);

  // Reemplazo completo de disponibilidad (idempotente)
  await supabase.from('vet_availability').delete().eq('vet_id', vet.id);
  const { error } = await supabase
    .from('vet_availability')
    .insert(parsed.data.map((slot) => ({ ...slot, vet_id: vet.id })));

  if (error) return c.json({ success: false, error: 'Error al guardar disponibilidad' }, 500);

  await audit(c, { action: 'vet.availability.update', resourceType: 'veterinarian', resourceId: vet.id });
  return c.json({ success: true });
});
