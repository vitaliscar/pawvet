/** URL pública del sitio (metadatos, sitemap). */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pawvet.net';

/** Áreas con sesión: no se indexan. */
export const PRIVATE_PATHS = ['/dashboard', '/vet', '/reservar', '/mis-citas'];
