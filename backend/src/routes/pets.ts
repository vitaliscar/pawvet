import { Hono } from 'hono';
import { z } from 'zod';
import { audit } from '../lib/audit.js';
import { decryptNullable, encryptNullable } from '../lib/crypto.js';
import { supabase } from '../lib/supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const petRoutes = new Hono();

petRoutes.use('*', requireAuth, requireRole('owner', 'admin'));

const petSchema = z.object({
  name: z.string().min(1).max(100),
  species: z.enum(['dog', 'cat', 'bird', 'rabbit', 'other']),
  breed: z.string().max(100).optional(),
  age_years: z.number().int().min(0).max(60).optional(),
  medical_history: z.string().max(20_000).optional(),
  photo_url: z.string().url().optional(),
});

async function ownerIdFor(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('pet_owners')
    .select('id')
    .eq('user_id', userId)
    .single();
  return data?.id ?? null;
}

petRoutes.get('/', async (c) => {
  const ownerId = await ownerIdFor(c.get('user').id);
  if (!ownerId) return c.json({ success: false, error: 'Perfil de dueño no encontrado' }, 404);

  const { data, error } = await supabase
    .from('pets')
    .select('id, name, species, breed, age_years, photo_url, created_at')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });

  if (error) return c.json({ success: false, error: 'Error al listar mascotas' }, 500);
  return c.json({ success: true, data });
});

petRoutes.get('/:id', async (c) => {
  const ownerId = await ownerIdFor(c.get('user').id);
  if (!ownerId) return c.json({ success: false, error: 'Perfil de dueño no encontrado' }, 404);

  const { data, error } = await supabase
    .from('pets')
    .select('*')
    .eq('id', c.req.param('id'))
    .eq('owner_id', ownerId)
    .single();

  if (error || !data) return c.json({ success: false, error: 'Mascota no encontrada' }, 404);

  await audit(c, { action: 'pet.view', resourceType: 'pet', resourceId: data.id });

  const { medical_history_enc, ...pet } = data;
  return c.json({
    success: true,
    data: { ...pet, medical_history: decryptNullable(medical_history_enc) },
  });
});

petRoutes.post('/', async (c) => {
  const ownerId = await ownerIdFor(c.get('user').id);
  if (!ownerId) return c.json({ success: false, error: 'Perfil de dueño no encontrado' }, 404);

  const parsed = petSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json(
      { success: false, error: 'Datos inválidos', details: parsed.error.flatten() },
      400,
    );
  }
  const { medical_history, ...fields } = parsed.data;

  const { data, error } = await supabase
    .from('pets')
    .insert({
      ...fields,
      owner_id: ownerId,
      medical_history_enc: encryptNullable(medical_history),
    })
    .select('id, name, species, breed, age_years, photo_url')
    .single();

  if (error) return c.json({ success: false, error: 'Error al crear mascota' }, 500);

  await audit(c, { action: 'pet.create', resourceType: 'pet', resourceId: data.id });
  return c.json({ success: true, data }, 201);
});

petRoutes.patch('/:id', async (c) => {
  const ownerId = await ownerIdFor(c.get('user').id);
  if (!ownerId) return c.json({ success: false, error: 'Perfil de dueño no encontrado' }, 404);

  const parsed = petSchema.partial().safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json(
      { success: false, error: 'Datos inválidos', details: parsed.error.flatten() },
      400,
    );
  }
  const { medical_history, ...fields } = parsed.data;
  const update: Record<string, unknown> = { ...fields };
  if (medical_history !== undefined) {
    update.medical_history_enc = encryptNullable(medical_history);
  }

  const { data, error } = await supabase
    .from('pets')
    .update(update)
    .eq('id', c.req.param('id'))
    .eq('owner_id', ownerId)
    .select('id')
    .single();

  if (error || !data) return c.json({ success: false, error: 'Mascota no encontrada' }, 404);

  await audit(c, { action: 'pet.update', resourceType: 'pet', resourceId: data.id });
  return c.json({ success: true, data });
});
