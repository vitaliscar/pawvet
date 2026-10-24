import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { env } from './config/env.js';
import { apiRateLimit } from './middleware/rate-limit.js';
import { adminRoutes } from './routes/admin.js';
import { appointmentRoutes } from './routes/appointments.js';
import { ownerRoutes } from './routes/owners.js';
import { petRoutes } from './routes/pets.js';
import { searchRoutes } from './routes/search.js';
import { vetRoutes } from './routes/vets.js';
import { webhookRoutes } from './routes/webhooks.js';

export const app = new Hono();

app.use('*', logger());
app.use('*', secureHeaders());
app.use(
  '*',
  cors({
    origin:
      env.NODE_ENV === 'production'
        ? ['https://pawvet.net', 'https://www.pawvet.net', 'https://admin.pawvet.net']
        : ['http://localhost:3000'],
    allowHeaders: ['Authorization', 'Content-Type'],
  }),
);
app.use('/api/*', apiRateLimit);

app.get('/health', (c) =>
  c.json({ success: true, service: 'pawvet-api', ts: new Date().toISOString() }),
);

app.route('/api/search', searchRoutes);
app.route('/api/owners', ownerRoutes);
app.route('/api/pets', petRoutes);
app.route('/api/vets', vetRoutes);
app.route('/api/appointments', appointmentRoutes);
app.route('/api/admin', adminRoutes);
app.route('/webhooks', webhookRoutes);

app.notFound((c) => c.json({ success: false, error: 'Recurso no encontrado' }, 404));
app.onError((err, c) => {
  console.error('[error]', err);
  return c.json({ success: false, error: 'Error interno del servidor' }, 500);
});
