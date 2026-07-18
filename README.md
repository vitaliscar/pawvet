# 🐾 PAWVET — Plataforma de Citas Veterinarias a Domicilio

Marketplace que conecta dueños de mascotas con veterinarios verificados en Chile.
Citas a domicilio o en consultorio, suscripción veterinaria, pagos vía Transbank.

## Estructura del Monorepo

```
pawvet/
├── backend/         API REST — Node.js + Hono + TypeScript
├── frontend-web/    Admin dashboard + web cliente — Next.js 14
├── mobile/          App iOS/Android — React Native + Expo
├── supabase/        Migraciones SQL, RLS policies, seed
├── infra/           Docker Compose, Nginx, deploy
├── docs/            Blueprint, legal, infraestructura
└── .github/         CI/CD workflows
```

## Stack

| Capa | Tecnología |
|------|-----------|
| Móvil | React Native + Expo |
| Web | Next.js 14 + TypeScript + Tailwind |
| API | Node.js + Hono + TypeScript + Zod |
| BD | Supabase (PostgreSQL + PostGIS + RLS) |
| Auth | Clerk (2FA obligatorio para vets) |
| Pagos | Transbank WebPay |
| Email | SendGrid |
| Push | Firebase Cloud Messaging |
| Hosting | Hetzner VPS + Docker + Nginx + Cloudflare |

## Quick Start (desarrollo)

```bash
# 1. Backend
cd backend
cp .env.example .env       # completa credenciales
npm install
npm run dev                # http://localhost:3001

# 2. Admin web
cd ../frontend-web
cp .env.example .env.local
npm install
npm run dev                # http://localhost:3000

# 3. Mobile
cd ../mobile
cp .env.example .env
npm install
npx expo start

# 4. Base de datos (Supabase CLI o dashboard SQL editor)
# Ejecuta en orden: supabase/migrations/*.sql
```

## Seguridad (NO NEGOCIABLE)

- Historiales médicos encriptados AES-256-GCM (campo a campo en backend)
- RLS en Supabase: cada usuario ve SOLO sus datos
- 2FA obligatorio para veterinarios (Clerk)
- Datos de tarjetas: SOLO Transbank — nunca se almacenan aquí
- Auditoría: tabla `audit_logs` + pgAudit
- Nunca commitear secrets: todo va en `.env` (ver `.env.example`)

## Documentación

- `docs/CLAUDE.md` — instrucciones de desarrollo y build order (20 semanas)
- `docs/vet-clinic-blueprint.md` — arquitectura completa
- `docs/PAWVET-INFRA-SETUP.md` — setup Hetzner paso a paso
- `docs/legal-templates.md` — documentos legales (revisar con abogado)
