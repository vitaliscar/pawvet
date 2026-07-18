# PAWVET — Instrucciones para Claude Code

Monorepo de la plataforma de citas veterinarias a domicilio (Chile).
La especificación completa vive en `docs/` — este archivo resume lo operativo.

## Estructura

- `backend/` — API Hono + TypeScript (puerto 3001). Entry: `src/index.ts`.
- `frontend-web/` — Next.js 14 App Router (admin dashboard). Puerto 3000.
- `mobile/` — Expo React Native.
- `supabase/migrations/` — schema SQL numerado. Ejecutar en orden.
- `infra/` — docker-compose + nginx.

## Comandos

```bash
cd backend && npm run dev        # API dev (tsx watch)
cd backend && npm test           # Vitest
cd backend && npm run typecheck  # tsc --noEmit
cd frontend-web && npm run dev   # Next dev
cd mobile && npx expo start      # Expo
```

## Reglas críticas

1. **Seguridad primero.** Datos médicos siempre encriptados con `backend/src/lib/crypto.ts`
   (AES-256-GCM) antes de persistir. Nunca guardar números de tarjeta — solo
   `transbank_transaction_id`, monto y estado.
2. **RLS obligatorio.** Toda tabla nueva necesita policies en una migración.
   El backend usa `service_role` y DEBE filtrar por usuario autenticado.
3. **Validación con Zod** en todo endpoint. Nunca confiar en input del cliente.
4. **No secrets en código.** Solo `.env` (validado en `backend/src/config/env.ts`).
5. **TypeScript strict**, funciones < 50 líneas, archivos < 800 líneas.
6. **Tests**: Vitest en backend, objetivo 80 % en lógica de negocio.
7. **Idioma**: código e identificadores en inglés; mensajes de cara al usuario en español (Chile).
8. **Commits**: conventional commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).

## Roles del sistema

- `owner` — dueño de mascota: gestiona mascotas, busca vets por radio, agenda citas.
- `vet` — veterinario verificado (RUT + Colegio Veterinarios): gestiona disponibilidad,
  citas, historial médico. Requiere 2FA y suscripción activa.
- `admin` — verifica vets, ve audit logs, gestiona suscripciones.

## Build order

Ver `docs/CLAUDE.md` (5 fases, 20 semanas). Fase actual: **FASE 1 — Core Backend + Admin**.
