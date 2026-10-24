# PAWVET — Atención veterinaria a domicilio

Proyecto en Fase 1: API, base PocketBase y panel administrativo. La portada presenta el servicio; la reserva pública y el pago todavía no están habilitados.

## Estructura del Monorepo

```
pawvet/
├── backend/         API REST — Node.js + Hono + TypeScript
├── frontend-web/    Admin dashboard + web cliente — Next.js 14
├── mobile/          App iOS/Android — React Native + Expo
├── pocketbase/      Esquema, migración y hooks activos
├── supabase/        Migraciones antiguas (deprecadas)
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
| BD y Auth | PocketBase 0.40.6 (SQLite, reglas por colección) |
| Pagos | Transbank WebPay (integración pendiente) |
| Email | SendGrid |
| Push | Firebase Cloud Messaging |
| Hosting | Hetzner VPS + Docker + Nginx + Cloudflare |

## Quick Start (desarrollo)

```bash
# 1. Descarga PocketBase 0.40.6 y extrae el binario en pocketbase/
# 2. Desde pocketbase/: .\pocketbase.exe serve --http=127.0.0.1:8090
#    La migración se aplica automáticamente; los datos quedan en pb_data/.
# 3. Con el servidor detenido, crea un superusuario:
#    .\pocketbase.exe superuser upsert EMAIL PASSWORD
# 4. Copia backend/.env.example a backend/.env. Completa URL, credenciales
#    y la clave médica (32 bytes en hex).
# 5. Copia frontend-web/.env.example a frontend-web/.env.local.
# 6. En backend/: npm ci && npm run dev     (API: puerto 3001)
# 7. En frontend-web/: npm ci && npm run dev (web: puerto 3000)
```

Si 8090 está ocupado, cambia el puerto de PocketBase y las URL de ambos archivos de entorno. Para entrar en /login, crea un registro en la colección users y asigna role = admin desde la consola de PocketBase. El superusuario y el usuario del panel son cuentas distintas.

En producción, infra/docker-compose.yml levanta PocketBase, API, web y Nginx. Revisa la configuración con docker compose -f infra/docker-compose.yml config y prepara los certificados TLS antes de levantar Nginx.

## Seguridad (NO NEGOCIABLE)

- Historiales médicos encriptados AES-256-GCM (campo a campo en backend)
- Las escrituras médicas pasan por la API; PocketBase bloquea escrituras directas en esas colecciones.
- El rol admin se asigna desde una cuenta superusuario.
- Datos de tarjetas: SOLO Transbank — nunca se almacenan aquí
- Auditoría en la colección audit_logs.
- Nunca commitear secrets: todo va en `.env` (ver `.env.example`)

## Documentación

- docs/ESTADO-ACTUAL.md — estado del código y pendientes conocidos
- docs/MODELO-NEGOCIO-REFERENTES.md — investigación de referentes
- docs/CLAUDE.md — plan histórico; algunas referencias de stack están desactualizadas
- `docs/vet-clinic-blueprint.md` — arquitectura completa
- `docs/PAWVET-INFRA-SETUP.md` — setup Hetzner paso a paso
- `docs/legal-templates.md` — documentos legales (revisar con abogado)
