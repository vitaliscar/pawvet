import { Hono } from 'hono';
import { z } from 'zod';
import { supabase } from '../lib/supabase.js';
import { requireAuth } from '../middleware/auth.js';

// Búsqueda geolocalizada de veterinarios verificados (RPC PostGIS).
export const searchRoutes = new Hono();

const searchQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  radius_km: z.coerce.number().int().min(1).max(100).default(10),
  service: z.enum(['home_visit', 'clinic_visit']).optional(),
});

searchRoutes.get('/vets', requireAuth, async (c) => {
  const parsed = searchQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json(
      { success: false, error: 'Parámetros inválidos', details: parsed.error.flatten() },
      400,
    );
  }
  const { lat, lon, radius_km, service } = parsed.data;

  const { data, error } = await supabase.rpc('search_vets_nearby', {
    lat,
    lon,
    radius_km,
    wanted_service: service ?? null,
  });

  if (error) {
    console.error('[search] rpc error:', error.message);
    return c.json({ success: false, error: 'Error en la búsqueda' }, 500);
  }

  return c.json({ success: true, data });
});
