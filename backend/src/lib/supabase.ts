import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

// Cliente service_role: bypasea RLS. TODA query DEBE filtrar por el usuario
// autenticado (ver middleware/auth.ts). Nunca exponer esta key al cliente.
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
