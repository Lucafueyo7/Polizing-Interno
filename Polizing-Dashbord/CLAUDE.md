# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # start Next.js dev server (uses Turbopack)
pnpm build        # production build
pnpm lint         # ESLint
pnpm test         # Vitest (run once)
pnpm test:watch   # Vitest in watch mode
pnpm db:seed      # seed database via prisma/seed.ts
```

Run a single test file:
```bash
pnpm vitest run lib/chatbot/__tests__/auth.test.ts
```

After schema changes:
```bash
pnpm prisma migrate dev    # apply migration (needs DIRECT_URL)
pnpm prisma generate       # regenerate client (also runs on postinstall)
```

## Stack

Next.js 16 App Router · React 19 · TypeScript · Tailwind CSS v4 · Prisma 7 (pg driver adapter) · Clerk auth · Vitest · Zod · react-hook-form · shadcn/ui

## Architecture

### App routes (`app/(app)/`)

Six main sections, each following the same file structure:

- `page.tsx` — server component: fetches data, renders layout
- `_components/` — UI components for that section
- `_actions/` — Next.js server actions (mutations)

**Siniestros** and **Pagos** use Next.js [parallel routes](https://nextjs.org/docs/app/building-your-application/routing/parallel-routes) (`@list` + `@detail`). The `layout.tsx` renders both slots side-by-side; navigating to `/siniestros/123` updates only the `@detail` slot without remounting `@list`. The layout's `page.tsx` handles the redirect to the first item.

### Data layer (`lib/data/`)

All DB access is server-only. Pattern in every module:
1. `findX()` — raw Prisma query
2. `toListItem()` — maps Prisma row → typed DTO
3. Exported `getX(filters)` — fetches + filters

Shared mappers live in `lib/data/_mappers.ts` (client refs, aseguradora refs, date helpers). All DTO types are in `lib/data/types.ts`.

Filtering for clientes and pólizas currently happens **in memory** after fetching all rows — not at the DB level.

### Database

Prisma 7 uses a driver adapter (not the classic connector):
- Runtime: `DATABASE_URL` → port 6543 (Supabase pgbouncer pooler)
- Migrations: `DIRECT_URL` → port 5432 (direct connection required)
- Generated client lives at `app/generated/prisma/` (non-standard, set in `schema.prisma`)
- Singleton client in `lib/prisma.ts` shared across hot-reloads

### Server actions (`_actions/`)

All mutations follow this pattern:
1. Validate input with Zod schema (defined in `_actions/schemas.ts`)
2. `getCurrentUser()` for audit fields (`modificado_por_id`, `modificado_en`)
3. Prisma write
4. `updateTag(CACHE_TAGS.xxx)` to bust Next.js data cache
5. Return `ActionResult` (`{ ok: true, id }` | `{ ok: false, error, fieldErrors? }`)

### Authentication

Clerk handles user sessions. `lib/auth/session.ts` → `getCurrentUser()` is the server-side helper. It cross-checks the Clerk user against the `usuarios` table (synced via Clerk webhook at `app/api/webhooks/clerk/route.ts`). A Clerk user without a matching `usuarios` row has no access.

### Chatbot API (`app/api/chatbot/`, `lib/chatbot/`)

External REST API consumed by a WhatsApp bot. All routes require `x-api-key` header (validated by `lib/chatbot/auth.ts` with timing-safe comparison against `CHATBOT_API_KEY` env var). Most unit tests in this repo cover this module.

### Cache

`lib/cache/tags.ts` defines the invalidation tags (`clientes`, `polizas`, `siniestros`, etc.). Server actions call `updateTag()` after writes; pages implicitly cache reads via Next.js data cache.

### Domain logic (`lib/domain/`)

Pure functions with no DB dependencies:
- `poliza-status.ts` — `PolizaEstado` / `SiniestroEstado` types and display metadata
- `cliente-helpers.ts` — label, ident, avatar initials from ClienteCore union
- `aseguradora-color.ts` — deterministic color per aseguradora id

### Known config quirks

- `next.config.ts` sets `turbopack.root: __dirname` — fixes workspace root detection when the lockfile is in the parent directory.
- `typescript.ignoreBuildErrors: true` — workaround for a Next.js 16 bug with Clerk's `[[...sign-in]]` catch-all routes.
- Vitest aliases `server-only` to a no-op stub (`test/stubs/server-only.ts`) so data modules can be imported in tests.

---

@AGENTS.md
