import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),

  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().optional(),

  MEDICAL_DATA_ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-f]{64}$/i, 'Debe ser 32 bytes en hex (openssl rand -hex 32)'),

  TRANSBANK_COMMERCE_CODE: z.string().min(1),
  TRANSBANK_API_KEY: z.string().min(1),
  TRANSBANK_ENV: z.enum(['integration', 'production']).default('integration'),

  GOOGLE_MAPS_API_KEY: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().default('noreply@pawvet.net'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variables de entorno inválidas:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
