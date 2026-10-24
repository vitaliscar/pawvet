import { Hono } from 'hono';
import { z } from 'zod';
import { audit } from '../lib/audit.js';
import { ensureAdminAuth, pb } from '../lib/pocketbase.js';
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
  await ensureAdminAuth();
  try {
    const data = await pb
      .collection('pet_owners')
      .getFirstListItem(`user_id = "${c.get('user').id}"`, {
        fields: 'id,full_name,address,preferred_radius_km,verified,terms_accepted_at,privacy_accepted_at',
      });
    return c.json({ success: true, data });
  } catch {
    return c.json({ success: false, error: 'Perfil no encontrado' }, 404);
  }
});

ownerRoutes.put('/me', async (c) => {
  const parsed = ownerProfileSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json(
      { success: false, error: 'Datos inválidos', details: parsed.error.flatten() },
      400,
    );
  }
  const { terms_accepted, privacy_accepted, ...fields } = parsed.data;
  const now = new Date().toISOString();

  const record: Record<string, unknown> = { ...fields, user_id: c.get('user').id };
  if (terms_accepted) record.terms_accepted_at = now;
  if (privacy_accepted) record.privacy_accepted_at = now;

  await ensureAdminAuth();
  try {
    let owner;
    try {
      owner = await pb.collection('pet_owners').getFirstListItem(`user_id = "${c.get('user').id}"`);
      owner = await pb.collection('pet_owners').update(owner.id, record);
    } catch {
      owner = await pb.collection('pet_owners').create(record);
    }
    await audit(c, { action: 'owner.profile.update', resourceType: 'pet_owner', resourceId: owner.id });
    return c.json({ success: true, data: { id: owner.id } });
  } catch (err) {
    console.error('[owners] upsert error:', err);
    return c.json({ success: false, error: 'Error al guardar perfil' }, 500);
  }
});
