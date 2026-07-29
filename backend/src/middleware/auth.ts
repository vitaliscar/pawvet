import type { Context, Next } from 'hono';
import PocketBase from 'pocketbase';
import { env } from '../config/env.js';

export interface AuthUser {
  id: string; // uuid interno = pocketbase record id de "users"
  authUserId: string; // igual a "id" — users es la propia colección auth
  email: string;
  role: 'owner' | 'vet' | 'admin';
}

declare module 'hono' {
  interface ContextVariableMap {
    user: AuthUser;
  }
}

/** Verifica el JWT de PocketBase (Authorization: Bearer) y carga el usuario. */
export async function requireAuth(c: Context, next: Next) {
  const header = c.req.header('Authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return c.json({ success: false, error: 'No autorizado' }, 401);
  }

  // Cliente efímero: valida el token del request contra PocketBase sin
  // interferir con la sesión admin compartida (lib/pocketbase.ts).
  const client = new PocketBase(env.POCKETBASE_URL);
  client.authStore.save(token, null);
  try {
    const { record } = await client.collection('users').authRefresh();
    c.set('user', {
      id: record.id,
      authUserId: record.id,
      email: record.email,
      role: record.role,
    });
  } catch {
    return c.json({ success: false, error: 'Token inválido o expirado' }, 401);
  }

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
