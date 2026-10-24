import { Hono } from 'hono';
import { z } from 'zod';
import { audit } from '../lib/audit.js';
import { ensureAdminAuth, pb } from '../lib/pocketbase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const adminRoutes = new Hono();

adminRoutes.use('*', requireAuth, requireRole('admin'));

// Vets pendientes de verificación
adminRoutes.get('/vets/pending', async (c) => {
  await ensureAdminAuth();
  const data = await pb.collection('veterinarians').getFullList({
    filter: 'verified = false',
    sort: 'created',
    fields: 'id,full_name,rut,license_number,clinic_name,rut_document_url,license_document_url,created',
  });
  return c.json({ success: true, data });
});

// Aprobar / rechazar vet
adminRoutes.post('/vets/:id/verify', async (c) => {
  const schema = z.object({ approved: z.boolean(), reason: z.string().max(500).optional() });
  const parsed = schema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ success: false, error: 'Datos inválidos' }, 400);

  const vetId = c.req.param('id');
  const adminUserId = c.get('user').id;

  await ensureAdminAuth();
  let data;
  try {
    data = await pb.collection('veterinarians').update(
      vetId,
      parsed.data.approved
        ? { verified: true, verified_by_admin_id: adminUserId, verified_at: new Date().toISOString() }
        : { verified: false, verified_by_admin_id: adminUserId },
    );
  } catch {
    return c.json({ success: false, error: 'Vet no encontrado' }, 404);
  }

  await audit(c, {
    action: parsed.data.approved ? 'admin.vet.approve' : 'admin.vet.reject',
    resourceType: 'veterinarian',
    resourceId: vetId,
    details: { reason: parsed.data.reason ?? null },
  });
  return c.json({ success: true, data: { id: data.id, verified: data.verified } });
});

// Audit logs (paginado)
adminRoutes.get('/audit-logs', async (c) => {
  const schema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    user_id: z.string().optional(),
    action: z.string().max(100).optional(),
  });
  const parsed = schema.safeParse(c.req.query());
  if (!parsed.success) return c.json({ success: false, error: 'Parámetros inválidos' }, 400);

  const { page, limit, user_id, action } = parsed.data;
  const filters: string[] = [];
  if (user_id) filters.push(`user_id = "${user_id}"`);
  if (action) filters.push(`action ~ "${action}"`);

  await ensureAdminAuth();
  const result = await pb.collection('audit_logs').getList(page, limit, {
    filter: filters.join(' && '),
    sort: '-created',
  });

  return c.json({
    success: true,
    data: result.items,
    meta: { total: result.totalItems, page, limit },
  });
});

// Suscripciones activas
adminRoutes.get('/subscriptions', async (c) => {
  await ensureAdminAuth();
  const data = await pb.collection('subscriptions').getFullList({
    sort: '-start_date',
    fields: 'id,vet_id,plan,price_clp,status,start_date,end_date,auto_renew',
    requestKey: null,
  });
  return c.json({ success: true, data: data.slice(0, 200) });
});
