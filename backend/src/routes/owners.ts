import { Hono } from 'hono';
import { z } from 'zod';
import { audit } from '../lib/audit.js';
import { supabase } from '../lib/supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const ownerRoutes = new Hono();

ownerRoutes.use('*', requireAuth, requireRole('owner', 'admin'));

const ownerProfileSchema = z.object({
  full_name: z.string().min(1).max(200),
  address: z.string().max(300).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lon: z.number().min(-180).max(180).optional(),
  preferred_radius_km: z.number().int().min(1).max(100).default(10),
  terms_accepted: z.boolean().optional(),
  privacy_accepted: z.boolean().optional(),
});

ownerRoutes.get('/me', async (c) => {
  const { data, error } = await supabase
    .from('pet_owners')
    .select('id, full_name, address, preferred_radius_km, verified, terms_accepted_at, privacy_accepted_at')
    .eq('user_id', c.get('user').id)
    .single();

  if (error || !data) return c.json({ success: false, error: 'Perfil no encontrado' }, 404);
  return c.json({ success: true, data });
});

ownerRoutes.put('/me', async (c) => {
  const parsed = ownerProfileSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json(
      { success: false, error: 'Datos inválidos', details: parsed.error.flatten() },
      400,
    );
  }
  const { lat, lon, terms_accepted, privacy_accepted, ...fields } = parsed.data;
  const now = new Date().toISOString();

  const record: Record<string, unknown> = {
    ...fields,
    user_id: c.get('user').id,
    location:
      lat !== undefined && lon !== undefined ? `SRID=4326;POINT(${lon} ${lat})` : null,
  };
  if (terms_accepted) record.terms_accepted_at = now;
  if (privacy_accepted) record.privacy_accepted_at = now;

  const { data, error } = await supabase
    .from('pet_owners')
    .upsert(record, { onConflict: 'user_id' })
    .select('id')
    .single();

  if (error) {
    console.error('[owners] upsert error:', error.message);
    return c.json({ success: false, error: 'Error al guardar perfil' }, 500);
  }

  await audit(c, { action: 'owner.profile.update', resourceType: 'pet_owner', resourceId: data.id });
  return c.json({ success: true, data });
});
