import { createClerkClient, verifyToken } from '@clerk/backend';
import type { Context, Next } from 'hono';
import { env } from '../config/env.js';
import { supabase } from '../lib/supabase.js';

export const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });

export interface AuthUser {
  id: string; // uuid interno
  clerkId: string;
  email: string;
  role: 'owner' | 'vet' | 'admin';
}

declare module 'hono' {
  interface ContextVariableMap {
    user: AuthUser;
  }
}

/** Verifica el JWT de Clerk (Authorization: Bearer) y carga el usuario interno. */
export async function requireAuth(c: Context, next: Next) {
  const header = c.req.header('Authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return c.json({ success: false, error: 'No autorizado' }, 401);
  }

  let clerkId: string;
  try {
    const payload = await verifyToken(token, { secretKey: env.CLERK_SECRET_KEY });
    clerkId = payload.sub;
  } catch {
    return c.json({ success: false, error: 'Token inválido o expirado' }, 401);
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('id, clerk_id, email, role')
    .eq('clerk_id', clerkId)
    .single();

  if (error || !user) {
    return c.json({ success: false, error: 'Usuario no registrado' }, 401);
  }

  c.set('user', {
    id: user.id,
    clerkId: user.clerk_id,
    email: user.email,
    role: user.role,
  });
  await next();
}

/** Restringe a ciertos roles. Usar después de requireAuth. */
export function requireRole(...roles: AuthUser['role'][]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user');
    if (!roles.includes(user.role)) {
      return c.json({ success: false, error: 'Permisos insuficientes' }, 403);
    }
    await next();
  };
}
