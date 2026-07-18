import { createHmac, timingSafeEqual } from 'node:crypto';
import { Hono } from 'hono';
import { z } from 'zod';
import { env } from '../config/env.js';
import { supabase } from '../lib/supabase.js';

export const webhookRoutes = new Hono();

// ─────────────────────────────────────────────
// Clerk → sincroniza usuarios a la tabla users
// Firma Svix: https://clerk.com/docs/webhooks/sync-data
// ─────────────────────────────────────────────
function verifySvixSignature(payload: string, headers: Record<string, string | undefined>): boolean {
  const secret = env.CLERK_WEBHOOK_SECRET;
  const id = headers['svix-id'];
  const timestamp = headers['svix-timestamp'];
  const signature = headers['svix-signature'];
  if (!secret || !id || !timestamp || !signature) return false;

  const secretBytes = Buffer.from(secret.replace('whsec_', ''), 'base64');
  const signedContent = `${id}.${timestamp}.${payload}`;
  const expected = createHmac('sha256', secretBytes).update(signedContent).digest('base64');

  return signature.split(' ').some((versioned) => {
    const sig = versioned.split(',')[1];
    if (!sig) return false;
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  });
}

const clerkEventSchema = z.object({
  type: z.string(),
  data: z.object({
    id: z.string(),
    email_addresses: z
      .array(z.object({ email_address: z.string().email() }))
      .optional(),
    public_metadata: z.record(z.unknown()).optional(),
  }),
});

webhookRoutes.post('/clerk', async (c) => {
  const payload = await c.req.text();
  const verified = verifySvixSignature(payload, {
    'svix-id': c.req.header('svix-id'),
    'svix-timestamp': c.req.header('svix-timestamp'),
    'svix-signature': c.req.header('svix-signature'),
  });
  if (!verified) return c.json({ success: false, error: 'Firma inválida' }, 401);

  const parsed = clerkEventSchema.safeParse(JSON.parse(payload));
  if (!parsed.success) return c.json({ success: false, error: 'Payload inválido' }, 400);

  const { type, data } = parsed.data;
  const email = data.email_addresses?.[0]?.email_address;

  if (type === 'user.created' && email) {
    const role = (data.public_metadata?.role as string) ?? 'owner';
    await supabase.from('users').upsert(
      { clerk_id: data.id, email, role: ['owner', 'vet', 'admin'].includes(role) ? role : 'owner' },
      { onConflict: 'clerk_id' },
    );
  } else if (type === 'user.deleted') {
    await supabase.from('users').delete().eq('clerk_id', data.id);
  }

  return c.json({ success: true });
});

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
