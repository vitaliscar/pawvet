import { Hono } from 'hono';
import { z } from 'zod';

export const webhookRoutes = new Hono();

// Nota: el registro de usuarios lo maneja PocketBase directamente (POST
// /api/collections/users/records desde el cliente) — no hay webhook de
// sincronización. El rol por defecto ('owner') se asigna vía pb_hooks
// (ver pocketbase/pb_hooks/) o manualmente en el Admin UI para admins/vets.

// ─────────────────────────────────────────────
// Transbank → confirmación de pago de suscripción
// TODO(FASE 2): integrar SDK oficial transbank-sdk y validar token TBK.
// Este endpoint es el esqueleto del commit de transacción.
// ─────────────────────────────────────────────
webhookRoutes.post('/transbank', async (c) => {
  const schema = z.object({
    token_ws: z.string().min(1),
  });
  const parsed = schema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ success: false, error: 'Payload inválido' }, 400);

  // TODO: WebpayPlus.Transaction.commit(token_ws) con transbank-sdk,
  // luego activar la suscripción del vet y registrar transaction_id.
  console.warn('[transbank] webhook recibido — integración pendiente (FASE 2)');
  return c.json({ success: true, pending: true });
});
