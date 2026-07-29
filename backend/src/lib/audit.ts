import type { Context } from 'hono';
import { ensureAdminAuth, pb } from './pocketbase.js';

interface AuditEntry {
  userId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, unknown>;
}

/** Registra un evento de auditoría. Nunca lanza: un fallo de auditoría
 *  no debe romper la request, pero sí se loguea en servidor. */
export async function audit(c: Context, entry: AuditEntry): Promise<void> {
  const ip =
    c.req.header('cf-connecting-ip') ??
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
    null;

  try {
    await ensureAdminAuth();
    await pb.collection('audit_logs').create({
      user_id: entry.userId ?? c.get('user')?.id ?? null,
      action: entry.action,
      resource_type: entry.resourceType ?? null,
      resource_id: entry.resourceId ?? null,
      details: entry.details ?? null,
      ip_address: ip,
    });
  } catch (err) {
    console.error('[audit] fallo al registrar evento:', entry.action, err);
  }
}
