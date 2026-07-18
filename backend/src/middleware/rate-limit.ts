import type { Context, Next } from 'hono';

// Rate limiter en memoria (suficiente para 1 instancia detrás de Nginx +
// Cloudflare). Si se escala horizontalmente, migrar a Redis.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const CLEANUP_INTERVAL_MS = 60_000;

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, CLEANUP_INTERVAL_MS).unref();

export function rateLimit(maxRequests: number, windowMs: number) {
  return async (c: Context, next: Next) => {
    const ip =
      c.req.header('cf-connecting-ip') ??
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
      'unknown';
    const key = `${c.req.path}:${ip}`;
    const now = Date.now();

    const bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
    } else if (bucket.count >= maxRequests) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      c.header('Retry-After', String(retryAfter));
      return c.json({ success: false, error: 'Demasiadas solicitudes' }, 429);
    } else {
      bucket.count += 1;
    }
    await next();
  };
}

/** Límite estricto para endpoints sensibles (login-like): 5 req / 15 min. */
export const strictRateLimit = rateLimit(5, 15 * 60_000);
/** Límite general de API: 100 req / min. */
export const apiRateLimit = rateLimit(100, 60_000);
