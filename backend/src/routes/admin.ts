import { Hono } from 'hono';
import { z } from 'zod';
import { audit } from '../lib/audit.js';
import { nowInChile } from '../lib/booking.js';
import { computePilotMetrics, type PilotAppointment } from '../lib/pilot-metrics.js';
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
  // pb.filter escapa los parámetros: nunca interpolar input del cliente en el filtro.
  if (user_id) filters.push(pb.filter('user_id = {:user_id}', { user_id }));
  if (action) filters.push(pb.filter('action ~ {:action}', { action }));

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

// Métricas del panel (conteos; totalItems evita traer registros)
adminRoutes.get('/metrics', async (c) => {
  await ensureAdminAuth();
  const count = async (collection: string, filter: string) =>
    (await pb.collection(collection).getList(1, 1, { filter, fields: 'id', requestKey: null })).totalItems;
  const today = nowInChile().slice(0, 10);

  const [pendingVets, verifiedVets, owners, todayAppointments, pending, confirmed, completed, cancelled] =
    await Promise.all([
      count('veterinarians', 'verified = false'),
      count('veterinarians', 'verified = true'),
      count('pet_owners', ''),
      count('appointments', pb.filter("scheduled_date = {:today} && status != 'cancelled'", { today })),
      count('appointments', "status = 'pending'"),
      count('appointments', "status = 'confirmed'"),
      count('appointments', "status = 'completed'"),
      count('appointments', "status = 'cancelled'"),
    ]);

  return c.json({
    success: true,
    data: {
      vets: { pending: pendingVets, verified: verifiedVets },
      owners,
      appointments: { today: todayAppointments, pending, confirmed, completed, cancelled },
    },
  });
});

// Métricas del piloto en una ventana de días (por defecto 28: el periodo de medición)
adminRoutes.get('/pilot-metrics', async (c) => {
  const parsed = z
    .object({ days: z.coerce.number().int().min(1).max(365).default(28) })
    .safeParse(c.req.query());
  if (!parsed.success) return c.json({ success: false, error: 'Parámetros inválidos' }, 400);

  const since = new Date(Date.now() - parsed.data.days * 86_400_000).toISOString().replace('T', ' ');
  const userIdsFor = async (action: string) =>
    (
      await pb.collection('audit_logs').getFullList({
        filter: pb.filter('action = {:action} && created >= {:since}', { action, since }),
        fields: 'user_id',
      })
    ).map((log) => log.user_id as string);

  // ponytail: agrega en memoria; suficiente para el volumen del piloto.
  await ensureAdminAuth();
  const [searcherIds, bookerIds, appointments] = await Promise.all([
    userIdsFor('search.vets'),
    userIdsFor('appointment.create'),
    pb.collection('appointments').getFullList({
      filter: pb.filter('created >= {:since}', { since }),
      expand: 'vet_id',
      fields: 'vet_id,status,expand.vet_id.full_name',
    }),
  ]);

  const data = computePilotMetrics({
    searcherIds,
    bookerIds,
    appointments: appointments.map((a) => ({
      vet_id: a.vet_id as string,
      vet_name: (a.expand?.vet_id?.full_name as string | undefined) ?? '—',
      status: a.status as PilotAppointment['status'],
    })),
  });
  return c.json({ success: true, data: { days: parsed.data.days, ...data } });
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
