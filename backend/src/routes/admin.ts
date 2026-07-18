import { Hono } from 'hono';
import { z } from 'zod';
import { audit } from '../lib/audit.js';
import { supabase } from '../lib/supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const adminRoutes = new Hono();

adminRoutes.use('*', requireAuth, requireRole('admin'));

// Vets pendientes de verificación
adminRoutes.get('/vets/pending', async (c) => {
  const { data, error } = await supabase
    .from('veterinarians')
    .select(
      'id, full_name, rut, license_number, clinic_name, rut_document_url, license_document_url, created_at',
    )
    .eq('verified', false)
    .order('created_at', { ascending: true });

  if (error) return c.json({ success: false, error: 'Error al listar' }, 500);
  return c.json({ success: true, data });
});

// Aprobar / rechazar vet
adminRoutes.post('/vets/:id/verify', async (c) => {
  const schema = z.object({ approved: z.boolean(), reason: z.string().max(500).optional() });
  const parsed = schema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ success: false, error: 'Datos inválidos' }, 400);

  const vetId = c.req.param('id');
  const adminUserId = c.get('user').id;

  const { data, error } = await supabase
    .from('veterinarians')
    .update(
      parsed.data.approved
        ? { verified: true, verified_by_admin_id: adminUserId, verified_at: new Date().toISOString() }
        : { verified: false, verified_by_admin_id: adminUserId },
    )
    .eq('id', vetId)
    .select('id, verified')
    .single();

  if (error || !data) return c.json({ success: false, error: 'Vet no encontrado' }, 404);

  await audit(c, {
    action: parsed.data.approved ? 'admin.vet.approve' : 'admin.vet.reject',
    resourceType: 'veterinarian',
    resourceId: vetId,
    details: { reason: parsed.data.reason ?? null },
  });
  return c.json({ success: true, data });
});

// Audit logs (paginado)
adminRoutes.get('/audit-logs', async (c) => {
  const schema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    user_id: z.string().uuid().optional(),
    action: z.string().max(100).optional(),
  });
  const parsed = schema.safeParse(c.req.query());
  if (!parsed.success) return c.json({ success: false, error: 'Parámetros inválidos' }, 400);

  const { page, limit, user_id, action } = parsed.data;
  let query = supabase
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (user_id) query = query.eq('user_id', user_id);
  if (action) query = query.ilike('action', `${action}%`);

  const { data, error, count } = await query;
  if (error) return c.json({ success: false, error: 'Error al listar logs' }, 500);

  return c.json({ success: true, data, meta: { total: count, page, limit } });
});

// Suscripciones activas
adminRoutes.get('/subscriptions', async (c) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('id, vet_id, plan, price_clp, status, start_date, end_date, auto_renew')
    .order('start_date', { ascending: false })
    .limit(200);

  if (error) return c.json({ success: false, error: 'Error al listar' }, 500);
  return c.json({ success: true, data });
});
