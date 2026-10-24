import { Hono } from 'hono';
import { z } from 'zod';
import { audit } from '../lib/audit.js';
import { decryptNullable, encryptNullable } from '../lib/crypto.js';
import { ensureAdminAuth, pb } from '../lib/pocketbase.js';
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
  await ensureAdminAuth();
  try {
    const owner = await pb.collection('pet_owners').getFirstListItem(`user_id = "${userId}"`);
    return owner.id;
  } catch {
    return null;
  }
}

petRoutes.get('/', async (c) => {
  const ownerId = await ownerIdFor(c.get('user').id);
  if (!ownerId) return c.json({ success: false, error: 'Perfil de dueño no encontrado' }, 404);

  const data = await pb.collection('pets').getFullList({
    filter: `owner_id = "${ownerId}"`,
    sort: '-created',
    fields: 'id,name,species,breed,age_years,photo_url,created',
  });
  return c.json({ success: true, data });
});

petRoutes.get('/:id', async (c) => {
  const ownerId = await ownerIdFor(c.get('user').id);
  if (!ownerId) return c.json({ success: false, error: 'Perfil de dueño no encontrado' }, 404);

  let pet;
  try {
    pet = await pb.collection('pets').getOne(c.req.param('id'));
  } catch {
    return c.json({ success: false, error: 'Mascota no encontrada' }, 404);
  }
  if (pet.owner_id !== ownerId) return c.json({ success: false, error: 'Mascota no encontrada' }, 404);

  await audit(c, { action: 'pet.view', resourceType: 'pet', resourceId: pet.id });

  const { medical_history_enc, ...rest } = pet;
  return c.json({
    success: true,
    data: { ...rest, medical_history: decryptNullable(medical_history_enc) },
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

  try {
    const data = await pb.collection('pets').create({
      ...fields,
      owner_id: ownerId,
      medical_history_enc: encryptNullable(medical_history),
    });
    await audit(c, { action: 'pet.create', resourceType: 'pet', resourceId: data.id });
    return c.json(
      {
        success: true,
        data: {
          id: data.id,
          name: data.name,
          species: data.species,
          breed: data.breed,
          age_years: data.age_years,
          photo_url: data.photo_url,
        },
      },
      201,
    );
  } catch (err) {
    console.error('[pets] create error:', err);
    return c.json({ success: false, error: 'Error al crear mascota' }, 500);
  }
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

  let existing;
  try {
    existing = await pb.collection('pets').getOne(c.req.param('id'));
  } catch {
    return c.json({ success: false, error: 'Mascota no encontrada' }, 404);
  }
  if (existing.owner_id !== ownerId) return c.json({ success: false, error: 'Mascota no encontrada' }, 404);

  const data = await pb.collection('pets').update(existing.id, update);
  await audit(c, { action: 'pet.update', resourceType: 'pet', resourceId: data.id });
  return c.json({ success: true, data: { id: data.id } });
});
