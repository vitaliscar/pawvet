import { serve } from '@hono/node-server';
import { app } from './app.js';
import { env } from './config/env.js';
import { startReminderLoop } from './lib/appointment-notifier.js';

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`🐾 PAWVET API escuchando en http://localhost:${info.port} (${env.NODE_ENV})`);
});
startReminderLoop();
