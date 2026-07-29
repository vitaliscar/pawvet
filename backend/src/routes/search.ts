import { Hono } from 'hono';
import { z } from 'zod';
import { haversineKm } from '../lib/geo.js';
import { requireAuth } from '../middleware/auth.js';
import { ensureAdminAuth, pb } from '../lib/pocketbase.js';

// Búsqueda geolocalizada de veterinarios verificados (Haversine en JS —
// PocketBase/SQLite no tiene equivalente a PostGIS).
export const searchRoutes = new Hono();

const searchQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  radius_km: z.coerce.number().int().min(1).max(100).default(10),
  service: z.enum(['home_visit', 'clinic_visit']).optional(),
});

interface VetRecord {
  id: string;
  full_name: string;
  clinic_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  offers_home_visits: boolean;
  offers_clinic_visits: boolean;
  clinic_lat: number | null;
  clinic_lon: number | null;
}

searchRoutes.get('/vets', requireAuth, async (c) => {
  const parsed = searchQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json(
      { success: false, error: 'Parámetros inválidos', details: parsed.error.flatten() },
      400,
    );
  }
  const { lat, lon, radius_km, service } = parsed.data;

  try {
    await ensureAdminAuth();
    const vets = await pb.collection('veterinarians').getFullList<VetRecord>({
      filter: "verified = true && subscription_status = 'active'",
    });

    const results = vets
      .filter((v) => v.clinic_lat != null && v.clinic_lon != null)
      .filter((v) => !service || (service === 'home_visit' ? v.offers_home_visits : v.offers_clinic_visits))
      .map((v) => ({
        vet_id: v.id,
        full_name: v.full_name,
        clinic_name: v.clinic_name,
        avatar_url: v.avatar_url,
        bio: v.bio,
        offers_home_visits: v.offers_home_visits,
        offers_clinic_visits: v.offers_clinic_visits,
        distance_km: Math.round(haversineKm(lat, lon, v.clinic_lat as number, v.clinic_lon as number) * 100) / 100,
      }))
      .filter((v) => v.distance_km <= radius_km)
      .sort((a, b) => a.distance_km - b.distance_km)
      .slice(0, 100);

    return c.json({ success: true, data: results });
  } catch (err) {
    console.error('[search] error:', err);
    return c.json({ success: false, error: 'Error en la búsqueda' }, 500);
  }
});
