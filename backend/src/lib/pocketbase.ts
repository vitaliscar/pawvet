import PocketBase from 'pocketbase';
import { env } from '../config/env.js';

// Cliente admin (superuser): bypasea las API rules de PocketBase. TODA query
// DEBE filtrar por el usuario autenticado (ver middleware/auth.ts). Nunca
// exponer estas credenciales al cliente.
export const pb = new PocketBase(env.POCKETBASE_URL);
pb.autoCancellation(false);

let authPromise: Promise<void> | null = null;

async function authenticateAdmin(): Promise<void> {
  await pb.collection('_superusers').authWithPassword(
    env.POCKETBASE_ADMIN_EMAIL,
    env.POCKETBASE_ADMIN_PASSWORD,
  );
}

/** Asegura que el cliente admin tenga una sesión válida antes de una query. */
export async function ensureAdminAuth(): Promise<void> {
  if (pb.authStore.isValid) return;
  authPromise ??= authenticateAdmin().finally(() => {
    authPromise = null;
  });
  await authPromise;
}
