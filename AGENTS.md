# Repository Guidelines

## Project Structure & Module Organization

PAWVET is a multi-package repository; install dependencies inside each package. `backend/src/` contains the Hono API, organized into routes, middleware, libraries, and configuration. `frontend-web/src/app/` contains the Next.js App Router pages; shared UI and API helpers live under `src/components/` and `src/lib/`. `mobile/src/` contains the Expo React Native screens and helpers. `pocketbase/` holds the active schema and hooks. `supabase/migrations/` is deprecated. `infra/` contains Docker Compose and Nginx files; `docs/` contains architecture and setup material. Backend tests sit beside source files, for example `backend/src/lib/crypto.test.ts`.

## Build, Test, and Development Commands

Run `npm install` from the package you are changing. Common commands:

- API: `cd backend && npm run dev` starts the server; `npm test`, `npm run typecheck`, and `npm run build` run Vitest, TypeScript checks, and compilation.
- Web: `cd frontend-web && npm run dev` starts Next.js; `npm run build` creates a production build and `npm run typecheck` checks types.
- Mobile: `cd mobile && npx expo start` starts Expo; `npm run typecheck` checks TypeScript.

## Coding Style & Naming Conventions

Use strict TypeScript and the existing two-space indentation. Keep code and identifiers in English; write user-facing text in Chilean Spanish. Follow existing naming: lowercase or kebab-case for backend modules (such as `rate-limit.ts`), PascalCase for React component names, and Next.js `page.tsx` route files. Use package lint scripts where available; no shared formatter is configured.

## Testing Guidelines

Backend tests use Vitest and the `*.test.ts` naming pattern. Run them with `cd backend && npm test`; add focused tests for business logic changes. Project instructions set an 80% coverage target for business logic. Web and mobile packages currently define no test runner.

## Commit & Pull Request Guidelines

Use the Conventional Commit prefixes documented in `CLAUDE.md`, such as `feat:`, `fix:`, `docs:`, `test:`, and `chore:`. Describe the change and verification in pull requests; include screenshots for visible web or mobile changes and note any environment or schema updates.

## Security & Configuration

Keep secrets in environment files and out of commits. Validate endpoint input with Zod, encrypt medical data through `backend/src/lib/crypto.ts`, and ensure PocketBase collection rules and authenticated-user filtering protect user records.
