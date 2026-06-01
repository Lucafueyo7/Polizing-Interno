# Polizing — Implementación Next.js 16.2.4 (production-grade)

## Context

Hay un bundle de Claude Design (HTML/CSS/JS prototipo) en `polizing/project/` que define el producto **Polizing** — un SaaS interno para una productora de seguros argentina con: dashboard ejecutivo, ABM de clientes (particulares y corporativos), aseguradoras, pólizas, bandeja de siniestros (WhatsApp + IA) y validación de pagos masivos corporativos.

El repositorio (`/Users/manuelducos/Desktop/Polizing-Interno/`) ya contiene **`my-app/`** — un proyecto Next.js **16.2.4** + React **19.2.4** + Prisma **7** (Postgres/Supabase) con `schema.prisma` definido y un esqueleto de data layer (`app/lib/data-clientes.ts`, `data-polizas.ts`, `data-siniestros.ts`). El objetivo es **construir el producto final dentro de `my-app/`**, recreando el diseño pixel-fiel pero idiomatic-Next 16, modular, SOLID, sin código repetido y siguiendo recomendaciones de Vercel.

**Decisiones cerradas con el usuario**:

1. Reutilizar `my-app/` como home del proyecto.
2. Stack UI: **Tailwind v4 + shadcn/ui** con tokens espejando `styles.css`.
3. Datos: **Server Components leyendo Prisma + seed** portado de `data.js`.
4. Auth: **mock** (cliente, igual que el diseño actual; sin DB en esta iteración) — pero con interfaz aislada para swap futuro.

---

## Stack y versiones

| Capa | Versión / Lib | Notas |
|---|---|---|
| Framework | Next.js 16.2.4 (App Router) | Ya instalado. RSC, Server Actions. `middleware.ts` deprecado → `proxy.ts`. |
| React | 19.2.4 | Ya instalado. |
| Estilos | Tailwind v4 | Ya instalado. `@theme inline` con tokens del diseño. |
| Componentes | shadcn/ui (canary) | Canary necesario para React 19 + Tailwind 4. |
| ORM | Prisma 7 + `@prisma/adapter-pg` | Ya configurado. |
| Iconos | `lucide-react` | Reemplaza el set inline `icons.jsx`. |
| Forms / validación | `zod` | Validar inputs de Server Actions. |
| Fechas | `date-fns` (es-AR) | Reemplaza helpers inline. |
| Utilidades | `clsx`, `tailwind-merge` | Helper `cn()` estándar de shadcn. |
| TS | 5.x strict | Ya configurado. |

**Next 16 specifics que vamos a respetar**: `proxy.ts` en lugar de `middleware.ts` (si hace falta guard server-side); `cacheComponents` queda **off** en el MVP (caching opt-in, sin `use cache`); `revalidateTag` ahora exige `cacheLife` profile cuando lo introduzcamos; usar `revalidatePath` para invalidación post Server Action.

---

## Decisiones arquitectónicas (SOLID)

- **S — Single Responsibility**: cada Server Action en su archivo (`_actions/<verb>.ts`); cada query Prisma vive en `lib/data/<feature>.ts` y nunca dentro de un componente; cada componente UI hace una sola cosa.
- **O — Open/Closed**: primitivas (`Modal`/`Dialog`, `Tabs`, `Segmented`, `EmptyState`, `Sparkline`, `KV`, `Field`, `Badge`) extensibles por props/slots, no por edición de su body.
- **L — Liskov**: badges (`PolizaBadge`, `SinBadge`, `ClienteTipoBadge`, `EstadoClienteBadge`) son envoltorios delgados sobre un `Badge` base con `variant`; intercambiables.
- **I — Interface Segregation**: el dominio expone DTOs por feature (`ClienteListItem`, `ClienteFull`, `PolizaListItem`, etc.); la UI **no** depende de tipos crudos de Prisma.
- **D — Dependency Inversion**: componentes Client reciben datos por props; la composición/fetch ocurre en Server Components. Auth abstraída detrás de `getCurrentUser()` — cualquier cosa que dependa del usuario llama a esa función, no implementa la lógica.

**Reglas de modularidad acordadas**:
- Ningún archivo monolítico — apuntar a < 200 LOC; modales con su propia ruta `_components/<x>-form-modal.tsx`.
- Cero `window.X` globals (el diseño los usa porque es prototipo en navegador).
- Cero strings de color/espaciado hardcodeados fuera de tokens.
- Cero `any`. TypeScript `strict`, ESLint sin warnings.

---

## Estructura de carpetas

```
my-app/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       ├── page.tsx                 # server: redirect si ya hay sesión
│   │       └── _components/
│   │           ├── login-aside.tsx      # server, pitch + stats estáticas
│   │           ├── login-form.tsx       # client, estado del form
│   │           └── demo-users.tsx       # client, quick-login
│   ├── (dashboard)/
│   │   ├── layout.tsx                   # server: guard + shell
│   │   ├── _components/
│   │   │   ├── sidebar.tsx              # client (collapsed state, badges)
│   │   │   ├── sidebar-nav.ts           # NAV_ITEMS const
│   │   │   ├── topbar.tsx               # client (search, theme, bell)
│   │   │   ├── theme-toggle.tsx
│   │   │   └── breadcrumb.tsx
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   └── _components/
│   │   │       ├── kpi-card.tsx
│   │   │       ├── kpi-grid.tsx
│   │   │       ├── siniestros-pendientes.tsx
│   │   │       ├── distribucion-aseguradoras.tsx
│   │   │       └── actividad-reciente.tsx
│   │   ├── clientes/
│   │   │   ├── page.tsx                 # listado (searchParams = filtros)
│   │   │   ├── [id]/page.tsx            # detalle con tabs
│   │   │   ├── _components/
│   │   │   │   ├── clientes-table.tsx
│   │   │   │   ├── clientes-filterbar.tsx     # client (URL state)
│   │   │   │   ├── cliente-detail-header.tsx
│   │   │   │   ├── cliente-info-card.tsx
│   │   │   │   ├── cliente-resumen-card.tsx
│   │   │   │   ├── cliente-tabs.tsx
│   │   │   │   └── cliente-form-modal.tsx     # client, abre con ?modal=
│   │   │   └── _actions/
│   │   │       ├── create-cliente.ts
│   │   │       ├── update-cliente.ts
│   │   │       └── schemas.ts                  # zod
│   │   ├── aseguradoras/
│   │   │   ├── page.tsx
│   │   │   ├── _components/
│   │   │   │   ├── aseguradoras-grid.tsx
│   │   │   │   ├── aseguradora-card.tsx
│   │   │   │   └── aseguradora-form-modal.tsx
│   │   │   └── _actions/
│   │   ├── polizas/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   ├── _components/
│   │   │   │   ├── polizas-table.tsx
│   │   │   │   ├── polizas-tabs.tsx
│   │   │   │   ├── polizas-filterbar.tsx
│   │   │   │   ├── poliza-form-modal.tsx
│   │   │   │   └── vencimiento-hint.tsx
│   │   │   └── _actions/
│   │   ├── siniestros/
│   │   │   ├── page.tsx                  # inbox split layout
│   │   │   ├── [id]/page.tsx             # selecciona detalle
│   │   │   ├── _components/
│   │   │   │   ├── inbox-list.tsx
│   │   │   │   ├── inbox-item.tsx
│   │   │   │   ├── inbox-detail.tsx
│   │   │   │   ├── ai-summary.tsx
│   │   │   │   ├── poliza-vinculada.tsx
│   │   │   │   ├── docs-grid.tsx
│   │   │   │   ├── doc-card.tsx
│   │   │   │   └── timeline.tsx
│   │   │   └── _actions/
│   │   └── pagos/
│   │       ├── page.tsx
│   │       ├── [id]/page.tsx
│   │       ├── _components/
│   │       │   ├── pagos-summary.tsx
│   │       │   ├── pagos-list.tsx
│   │       │   ├── pago-detail.tsx
│   │       │   ├── pago-row.tsx
│   │       │   └── pago-totals.tsx
│   │       └── _actions/
│   │           └── validar-pago.ts
│   ├── layout.tsx                        # root: html, fonts, ThemeProvider
│   ├── globals.css                       # Tailwind v4 + tokens
│   ├── not-found.tsx
│   └── page.tsx                          # redirect → /dashboard (o /login)
├── components/
│   ├── ui/                               # shadcn/ui generated
│   │   ├── button.tsx, input.tsx, select.tsx, label.tsx
│   │   ├── dialog.tsx, tabs.tsx, badge.tsx, card.tsx
│   │   ├── table.tsx, checkbox.tsx, separator.tsx
│   │   ├── tooltip.tsx, dropdown-menu.tsx
│   ├── shared/
│   │   ├── status-badges/
│   │   │   ├── poliza-badge.tsx
│   │   │   ├── siniestro-badge.tsx
│   │   │   ├── cliente-tipo-badge.tsx
│   │   │   └── estado-cliente-badge.tsx
│   │   ├── segmented.tsx
│   │   ├── empty-state.tsx
│   │   ├── sparkline.tsx
│   │   ├── kv-row.tsx
│   │   ├── filterbar.tsx
│   │   ├── page-header.tsx
│   │   ├── page-actions.tsx
│   │   └── pagination.tsx
│   └── icons.ts                          # alias semánticos sobre lucide-react
├── lib/
│   ├── prisma.ts                         # ya existe — sin tocar
│   ├── auth/
│   │   ├── session.ts                    # mock: getCurrentUser, login, logout
│   │   ├── types.ts
│   │   └── demo-users.ts
│   ├── data/
│   │   ├── clientes.ts                   # mover/extender el actual data-clientes.ts
│   │   ├── polizas.ts
│   │   ├── siniestros.ts
│   │   ├── aseguradoras.ts
│   │   ├── pagos.ts
│   │   └── kpis.ts                       # agregaciones de dashboard
│   ├── format/
│   │   ├── currency.ts                   # fmtAR (es-AR ARS)
│   │   ├── number.ts                     # fmtNum
│   │   ├── date.ts                       # fmtDate, daysBetween, daysUntilExpiry
│   │   └── time-ago.ts
│   ├── domain/                           # lógica pura, sin I/O
│   │   ├── poliza-status.ts              # vigente/proxima/vencida
│   │   ├── cliente-helpers.ts            # label, ident, avatarLetters
│   │   └── pago-totales.ts
│   ├── theme/
│   │   ├── tokens.ts
│   │   └── theme-provider.tsx
│   └── utils/
│       ├── cn.ts                         # clsx + tailwind-merge
│       └── invariant.ts
├── prisma/
│   ├── schema.prisma                     # ya existe — extender
│   ├── seed.ts                           # NUEVO: port de data.js
│   └── migrations/
├── proxy.ts                              # ex-middleware (Next 16 rename), opcional
└── package.json
```

---

## Theming (Tailwind v4 + tokens del diseño)

Reescribir `app/globals.css`:

```css
@import "tailwindcss";

@theme inline {
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-surface-2: var(--surface-2);
  --color-border: var(--border);
  --color-fg: var(--fg);
  --color-fg-2: var(--fg-2);
  --color-muted: var(--muted);
  --color-primary: var(--primary);
  --color-accent: var(--accent);
  --color-warn: var(--warn);
  --color-danger: var(--danger);
  --color-info: var(--info);
  --color-whatsapp: var(--whatsapp);
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;
  --radius-sm: 6px;
  --radius: 10px;
  --radius-lg: 14px;
}

:root { /* mismas variables que polizing/project/styles.css */ }
[data-theme="dark"] { /* dark variant idéntico al diseño */ }
```

Fuentes en `app/layout.tsx` con `next/font/google` (`Inter` + `IBM_Plex_Mono`), seteando las CSS vars correspondientes (no `Geist`/`Geist_Mono` que vienen por default).

`ThemeProvider` (client) replica el `useEffect` del `app.jsx` original: lee `localStorage.getItem("polizing-theme")`, setea `document.documentElement.dataset.theme`, persiste cambios.

Los **colores hex de cada aseguradora** (campo en DB) se aplican vía `style={{ background: a.color }}` — no son tokens.

---

## Auth (mock, con contrato real)

`lib/auth/session.ts`:

- `loginAction(email, password)` — `"use server"`. Mock: si email vacío retorna `{error}`; si contiene `admin` rol = `Administrativo`, sino `Productor`. Setea cookie httpOnly firmada con `crypto.randomUUID()` que serializa `{email, name, role}`.
- `logoutAction()` — borra cookie, `redirect("/login")`.
- `getCurrentUser(): Promise<User | null>` — lee cookie con `cookies()` de `next/headers`, decodea, retorna `User` o `null`.

`(dashboard)/layout.tsx` server: si `!await getCurrentUser()` → `redirect("/login")`.

Demo users (`lib/auth/demo-users.ts`) idénticos al diseño: Mariano Pereyra (Productor), Lucía Bertotto (Administrativo).

**Esta interfaz es la misma que tendría auth real** — futura migración solo cambia las implementaciones.

---

## Datos

### Schema gaps (migración nueva)

El schema actual no cubre todos los campos del diseño. Una migración `add_design_fields` agrega:

```prisma
model empresas_aseguradoras {
  // existing...
  contacto_nombre  String?
  direccion        String?
  color_hex        String?  // marca visual de la compañía
}

model siniestros {
  // existing...
  numero           String?  @unique
  titulo           String?
  fuente           String?  // 'whatsapp' | 'email'
  leido            Boolean  @default(false)
  ai_summary       String?
}

model polizas {
  // existing...
  prima_mensual    Decimal? @db.Decimal(15, 2)
}

model clientes {
  // existing...
  // Nada nuevo — el split corp/no-corp ya existe en tablas hijas.
}
```

(Lista final se cierra al implementar el seed; cualquier campo extra se agrega en migración aparte — nunca mezclado con cambios de UI.)

### Seed (`prisma/seed.ts`)

Porta los arrays de `polizing/project/src/data.js` a Prisma:

| Array origen | Tablas destino |
|---|---|
| `CLIENTES` | `clientes` + `clientes_corporativos` o `clientes_no_corporativos` |
| `ASEGURADORAS` | `empresas_aseguradoras` |
| `POLIZAS` | `polizas` + `poliza_cliente` + `poliza_empresa` + `cobertura_poliza` + `tipo_poliza` |
| `SINIESTROS` | `siniestros` + `siniestros_poliza` (docs en `documentos_adjuntos: String[]`) |
| `PAGOS_MASIVOS` | `pagos` + `pagos_polizas` |

Configurado en `package.json`:
```json
"prisma": { "seed": "tsx prisma/seed.ts" }
```

### Data layer (`lib/data/<feature>.ts`)

Cada archivo exporta funciones puras async tipadas, retornando **DTOs** (no entidades Prisma):

```ts
// lib/data/clientes.ts
export type ClienteListItem = {
  id: number; tipo: "corp" | "normal"; label: string; ident: string;
  email: string | null; telefono: string | null; estado: string | null;
  polizasActivas: number; primaMensual: number;
};
export async function getClientes(filters: ClienteFilters): Promise<ClienteListItem[]> { ... }
export async function getClienteById(id: number): Promise<ClienteFull | null> { ... }
```

El mapeo Prisma→DTO ocurre acá, una sola vez. Las vistas no conocen el shape de Prisma.

### Server Actions

Patrón estricto por archivo:

```ts
"use server";
import { z } from "zod";
const Schema = z.object({ ... });
export async function createCliente(formData: FormData) {
  const parsed = Schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.format() };
  await prisma.clientes.create({ data: ... });
  revalidatePath("/clientes");
  return { ok: true };
}
```

---

## Iconografía

`components/icons.ts` re-exporta `lucide-react` con alias semánticos del diseño:

```ts
export {
  LayoutDashboard as Dashboard, Users, User, Building2 as Building,
  Shield, ShieldCheck, AlertTriangle as AlertIcon, Wallet, Settings,
  Search, Bell, Plus, Filter, Download, ChevronRight, ChevronLeft,
  ChevronsLeft, ChevronsRight, X as Close, Mail, Phone, Lock,
  Eye, EyeOff, Calendar, Clock, TrendingUp as TrendUp,
  TrendingDown as TrendDown, MoreHorizontal as More, Edit, Trash2 as Trash,
  MessageCircle as WhatsApp, FileText, Image as ImageIcon, Paperclip,
  Inbox, Check, CheckCircle, Send, Sparkles, ArrowRight, ArrowUpRight,
  ArrowUpDown as Sort, RefreshCw as Refresh, LogOut as Logout,
  HelpCircle as Help, Sun, Moon, Coins, Briefcase, Reply, Forward, Tag,
} from "lucide-react";
```

**No reimplementar inline SVGs** — `icons.jsx` solo se usa como referencia visual del diseño.

---

## Vistas — comportamiento por página

### `/login`
- Server: si hay cookie válida, redirect a `/dashboard`.
- Aside (server, estático): pitch, 3 stats, brand.
- Form (client): `email/password/showPw/remember/loading/error`. Submit llama `loginAction` → router push.
- Demo users (client): chips que disparan `loginAction` con email del usuario demo.

### `/dashboard`
- Server: `Promise.all` para KPIs paralelos vía `lib/data/kpis.ts`.
- 4 KPI cards (clientes activos, pólizas vigentes, siniestros en trámite, prima mensual) con `Sparkline` (client island).
- Siniestros pendientes: lista de `nuevos`, click → `/siniestros/[id]`.
- Distribución por aseguradora: barras horizontales con `color_hex` de cada compañía.
- Actividad reciente: placeholder hasta que haya tabla de auditoría.

### `/clientes` y `/clientes/[id]`
- `/clientes`: filtros vía `searchParams` (`?q=&tipo=&estado=`). Filterbar (client) actualiza la URL con `useRouter.push`.
- Tabla server-rendered. Click en fila → `/clientes/[id]`.
- Modal create/edit abre con `?modal=create` o `?modal=edit&id=...` (deep-linkable). Submit → Server Action → `revalidatePath`.
- `/clientes/[id]`: cards info + resumen + tabs `contrataciones | siniestros | actividad` (URL state).

### `/aseguradoras`
- Grid de cards (auto-fill 320px). Modal create. Click en card abre detalle ligero (otra ruta o sheet — MVP: solo card; detalle queda como nice-to-have).

### `/polizas` y `/polizas/[id]`
- Tabs estado en URL. Filterbar (tipo, aseguradora) en URL.
- Tabla server. Vencimiento hint computado en server con `daysUntilExpiry` (consistencia con `TODAY` del seed).
- Form modal multi-sección (Vinculación / Datos / Vigencia / Montos).

### `/siniestros` y `/siniestros/[id]`
- Layout split: `inbox-list` (izq) + `inbox-detail` (der).
- `/siniestros` muestra el primero por default; navegación a `/siniestros/[id]` mantiene la lista (vía layout compartido o `parallel routes`).
- Detalle: AI summary card, póliza vinculada (link a `/polizas/[id]`), descripción, docs grid, timeline.
- Acciones (Aprobar/Derivar/Responder) son Server Actions placeholder en MVP — registran y `revalidatePath`.

### `/pagos` y `/pagos/[id]`
- Summary KPI strip (incluyendo card "Pendientes" en color primary fuerte).
- Lista pagos + detalle. Validar/Rechazar son Server Actions reales que mutan estado del pago.

---

## Archivos críticos

### Existentes a modificar
- `my-app/app/page.tsx` → reemplazar landing default por `redirect("/dashboard")` (auth lo redirigirá a `/login` si no hay sesión).
- `my-app/app/layout.tsx` → fuentes Inter + IBM Plex Mono, `lang="es"`, `ThemeProvider`, sin Geist.
- `my-app/app/globals.css` → tokens del diseño + `@theme inline`.
- `my-app/app/lib/data-clientes.ts`, `data-polizas.ts`, `data-siniestros.ts` → mover a `lib/data/`, normalizar a contratos DTO, agregar funciones que el diseño necesita (filtros, agregaciones).
- `my-app/app/lib/prisma.ts` → mantener.
- `my-app/prisma/schema.prisma` → migración con campos faltantes (sección "Schema gaps").
- `my-app/next.config.ts` → posiblemente `experimental: { typedRoutes: true }`.
- `my-app/package.json` → agregar deps + script `db:seed`.

### Nuevos
- `prisma/seed.ts`
- Todo el árbol bajo `app/(auth)/`, `app/(dashboard)/`, `components/ui/`, `components/shared/`, `components/icons.ts`, `lib/auth/`, `lib/format/`, `lib/domain/`, `lib/theme/`, `lib/utils/`.

### Referencia (no copiar mecánicamente, recrear idiomatic)
- `polizing/project/src/data.js` → fuente del seed.
- `polizing/project/styles.css` → fuente de tokens y patrones visuales.
- `polizing/project/src/views/*.jsx` → blueprint de comportamiento y composición visual.

---

## Etapas incrementales (cada una entregable y testeable)

Cada etapa se mergea sola, corre `npm run dev` sin romper, pasa `npm run lint` + `npx tsc --noEmit`, y cumple su **acceptance test**. Una etapa no puede empezar hasta que la anterior esté verde.

---

### Etapa 0 — Foundation (sin features, app vestida)

**Scope**
- `npm install` y agregar deps: `lucide-react clsx tailwind-merge zod date-fns tsx`.
- `npx shadcn@canary init` + add (`button input select label dialog tabs badge card table checkbox separator tooltip dropdown-menu`).
- `lib/utils/cn.ts`, `lib/format/{currency,number,date,time-ago}.ts`, `lib/domain/{poliza-status,cliente-helpers,pago-totales}.ts`.
- `lib/theme/theme-provider.tsx` (client provider con `localStorage` + `data-theme`).
- `app/globals.css` con tokens del diseño + `@theme inline` + dark variant.
- `app/layout.tsx` reescrito: `lang="es"`, Inter + IBM Plex Mono, `ThemeProvider`, sin Geist.
- `app/page.tsx` provisional: pantalla "Polizing — coming soon" con tipografía y tokens correctos (sirve para validar el theming).
- `components/icons.ts` con re-exports de `lucide-react`.

**Acceptance**
- `npm run dev` → home muestra "Polizing — coming soon" con fuentes Inter/IBM Plex Mono cargadas.
- En devtools, `<html data-theme="light">` presente; `:root` tiene `--primary: #0f2744` y `--accent: #0d8a5f`.
- Clase Tailwind `bg-primary` pinta navy `#0f2744`, `text-accent` pinta verde `#0d8a5f`.
- `lint` y `tsc --noEmit` verdes.

---

### Etapa 1 — Auth mock + shell del dashboard (sin contenido real)

**Scope**
- `lib/auth/{session,types,demo-users}.ts` (mock con cookie httpOnly serializada).
- `app/(auth)/login/page.tsx` + `_components/{login-aside,login-form,demo-users}.tsx` — pixel-fiel al diseño.
- `app/(dashboard)/layout.tsx` con guard server (`!user → redirect("/login")`).
- `_components/{sidebar,topbar,theme-toggle,breadcrumb}.tsx` + `sidebar-nav.ts`.
- `app/(dashboard)/dashboard/page.tsx` placeholder ("Dashboard — próximamente").
- Stubs de páginas para cada item del sidebar (`clientes/page.tsx`, etc.) → cada una solo renderiza `<PageHeader title="..."/>` y un `<EmptyState/>`. Sirve para validar la nav y los breadcrumbs.
- `app/page.tsx` → `redirect("/dashboard")`.
- `components/shared/{page-header,empty-state}.tsx` (mínimas necesarias para los stubs).

**Acceptance**
- `/` → redirect a `/login` (sin sesión) o `/dashboard` (con sesión).
- Login con demo user "Mariano Pereyra" → cookie seteada → `/dashboard`.
- Sidebar navega entre las 6 secciones; breadcrumb se actualiza; cada stub muestra título correcto y estado vacío.
- Toggle sol/luna en topbar cambia tokens y persiste reload.
- Sidebar collapsed state persiste (localStorage opcional, o solo session).
- Logout → cookie borrada → `/login`. Intentar `/dashboard` redirige.
- `lint`/`tsc` verdes.

---

### Etapa 2 — Schema + seed + data layer (DB conectada, sin UI nueva)

**Scope**
- Extender `prisma/schema.prisma` con campos faltantes (sección "Schema gaps").
- `npx prisma migrate dev --name add_design_fields`.
- `prisma/seed.ts` portando los 5 arrays de `polizing/project/src/data.js`.
- Configurar seed en `package.json` (`"prisma": { "seed": "tsx prisma/seed.ts" }`).
- Mover/reescribir queries existentes a `lib/data/{clientes,polizas,siniestros,aseguradoras,pagos,kpis}.ts` con DTOs tipados.
- Borrar `app/lib/data-*.ts` antiguos (consolidados en `lib/data/`).
- Una **route de smoke** temporal `/dashboard/_debug/page.tsx` (server) que llame a cada `getX()` y muestre counts crudos. Se borra al final de la etapa.

**Acceptance**
- `npx prisma db seed` corre sin errores y deja la DB con 12 clientes, 5 aseguradoras, 18 pólizas, 8 siniestros, 5 pagos.
- `/dashboard/_debug` muestra los counts correctos leídos desde Prisma.
- Cada `getX()` retorna DTO (no objeto Prisma crudo); tipos verificados en `tsc`.
- `db push --force-reset && db seed` es reproducible.
- `_debug` borrada al cierre de la etapa.

---

### Etapa 3 — Dashboard real

**Scope**
- `app/(dashboard)/dashboard/page.tsx` con `Promise.all` sobre `lib/data/kpis.ts`.
- `_components/{kpi-card,kpi-grid,siniestros-pendientes,distribucion-aseguradoras,actividad-reciente}.tsx`.
- `components/shared/sparkline.tsx` (client island, recibe `values[]`).
- `components/shared/status-badges/{poliza-badge,siniestro-badge,cliente-tipo-badge,estado-cliente-badge}.tsx` — necesarios para esta etapa y siguientes.

**Acceptance**
- `/dashboard` muestra los 4 KPIs con números reales del seed (clientes activos = 11, pólizas vigentes+próx = ~15, siniestros nuevos+trámite = 6, prima mensual ARS).
- Sparklines renderizan en cada KPI.
- Lista "Siniestros pendientes" muestra los 2 nuevos del seed; cada item linkea a `/siniestros/[id]` (la ruta puede aún no existir — link queda válido para etapa 7).
- Distribución por aseguradora muestra 5 barras con colores `color_hex` y porcentajes correctos.
- Actividad reciente: placeholder con datos hardcoded (se conectará cuando exista auditoría).

---

### Etapa 4 — Clientes (lista + detalle + ABM)

**Scope**
- `app/(dashboard)/clientes/page.tsx` (server, `searchParams` = filtros).
- `[id]/page.tsx` (detalle con tabs).
- `_components/`: `clientes-table`, `clientes-filterbar` (client, URL state), `cliente-detail-header`, `cliente-info-card`, `cliente-resumen-card`, `cliente-tabs`, `cliente-form-modal`.
- `_actions/{create-cliente,update-cliente,schemas}.ts`.
- `components/shared/{filterbar,pagination}.tsx`, `cliente-avatar.tsx`.

**Acceptance**
- `/clientes` lista los 12 clientes; search por "Sofía" deja 1 fila; segmented tipo Particulares/Corp filtra; estado select filtra.
- Click en fila → `/clientes/[id]` con header (avatar, badges, ident), info card, resumen card (pólizas activas, prima anualizada, siniestros 12m), tabs `Contrataciones (n)` / `Siniestros (n)` / `Actividad`.
- "Nuevo cliente" abre modal (`?modal=create`) → submit corp con CUIT → fila aparece sin reload (revalidate).
- Editar cliente desde detalle → modal pre-fillado → submit → cambios visibles.
- Filtros sobreviven a reload (están en URL).

---

### Etapa 5 — Aseguradoras

**Scope**
- `app/(dashboard)/aseguradoras/page.tsx` con grid de cards.
- `_components/{aseguradoras-grid,aseguradora-card,aseguradora-form-modal}.tsx`.
- `_actions/create-aseguradora.ts`.

**Acceptance**
- `/aseguradoras` muestra 5 cards con logo (iniciales sobre `color_hex`), CUIT, contacto, email, teléfono, KPIs (pólizas activas, prima mensual), barra de % cartera.
- "Nueva aseguradora" abre modal → submit → card aparece.

---

### Etapa 6 — Pólizas (lista + detalle + ABM)

**Scope**
- `app/(dashboard)/polizas/page.tsx` y `[id]/page.tsx`.
- `_components/{polizas-table,polizas-tabs,polizas-filterbar,poliza-form-modal,vencimiento-hint}.tsx`.
- `_actions/{create-poliza,update-poliza,schemas}.ts`.

**Acceptance**
- `/polizas` muestra 18 pólizas; tabs (Todas/Vigentes/Próx/Renovadas/Vencidas/Anuladas) filtran con counts correctos.
- Filterbar por tipo de seguro y aseguradora funciona; combina con tabs y search.
- Vencimiento hint en rojo si ≤15 días, naranja si ≤60 días, ambos sólo para `vigente`/`proxima`.
- "Nueva póliza" desde `/polizas` abre modal vacío; desde detalle de cliente abre con cliente prefillado (`?newForCliente=...`).
- Footer muestra prima total filtrada.

---

### Etapa 7 — Siniestros (inbox)

**Scope**
- `app/(dashboard)/siniestros/page.tsx` (layout split, redirect al primer item si no hay `[id]`).
- `[id]/page.tsx`.
- `_components/{inbox-list,inbox-item,inbox-detail,ai-summary,poliza-vinculada,docs-grid,doc-card,timeline}.tsx`.
- `_actions/{aprobar-tramite,derivar-siniestro,marcar-leido}.ts` (mutaciones reales sobre estado y `leido`).

**Acceptance**
- `/siniestros` selecciona el primero por default y renderiza el detalle a la derecha.
- Tabs (Todos/Nuevos/En trámite/Cerrados) filtran la lista; counts correctos.
- Search filtra por cliente, número, título.
- Click en item → URL cambia a `/siniestros/[id]` y detalle se actualiza sin perder la lista.
- Detalle muestra: AI summary, póliza vinculada con link funcional a `/polizas/[id]`, descripción, docs grid (img/pdf), timeline (IA procesó + reporte WhatsApp).
- "Aprobar trámite" cambia estado `nuevo→tramite` y refleja en lista (revalidate).

---

### Etapa 8 — Pagos masivos

**Scope**
- `app/(dashboard)/pagos/page.tsx` y `[id]/page.tsx`.
- `_components/{pagos-summary,pagos-list,pago-detail,pago-row,pago-totals}.tsx`.
- `_actions/{validar-pago,rechazar-pago}.ts`.

**Acceptance**
- `/pagos` muestra summary KPI strip (Pendientes en card primary, Validados, Pólizas alcanzadas, Empresas).
- Segmented Pendientes/Validados/Todos filtra.
- Detalle muestra método, comprobante, CUIT, items por póliza con aseguradora colored dot, totales (subtotal/IVA/total).
- "Validar pago" cambia estado `pendiente→validado` → fila se mueve de tab y summary se recalcula.
- Banner amarillo en pendientes / verde en validados.

---

### Etapa 9 — Hardening final

**Scope**
- Pixel-fidelity pass: comparar cada ruta contra `polizing/project/Polizing.html` abierto en browser; ajustes finos de spacing/borders.
- Auditoría de modularidad: ningún archivo > 200 LOC (refactor si pasa).
- Revisar que no quede ningún `any`, `window.X`, color hex fuera de tokens.
- `npm run build` limpio (0 warnings, 0 errors).
- Smoke test golden path completo (10 pasos abajo) en una sola sesión.

**Acceptance — golden path E2E**
1. `/login` → demo user "Mariano Pereyra" → `/dashboard`.
2. Dashboard muestra KPIs reales del seed.
3. `/clientes` → search "Sofía" filtra → click fila → detalle con tabs `Contrataciones (2)` / `Siniestros (1)`.
4. `/clientes` → "Nuevo cliente" → submit corp → fila aparece sin reload.
5. Detalle de cliente → "Nueva póliza" → modal con cliente prefillado.
6. `/polizas` → tab "Próx. a vencer" filtra → hint en rojo si ≤15 días.
7. `/siniestros` → primer caso "nuevo" seleccionado → detalle con AI summary → click "Ver póliza" navega a `/polizas/[id]`.
8. `/pagos` → "Validar pago" → estado cambia, summary se actualiza.
9. Toggle sol/luna → todos los tokens cambian; persiste reload.
10. Logout → `/login`; `/dashboard` directo redirige.

### Métricas de calidad (criterio "profesional", aplican desde Etapa 0)
- TypeScript `strict`: 0 errores en cada etapa.
- ESLint: 0 warnings, 0 errors en cada etapa.
- Ningún archivo fuente > 200 LOC (regla blanda; modales más grandes ok si están aislados).
- Cero `any`. Cero `window.X` globals. Cero strings de color hardcodeados fuera de tokens.
- Seed reproducible: `db push --force-reset && db seed` deja el sistema en estado conocido.

### Comandos por etapa
```bash
cd /Users/manuelducos/Desktop/Polizing-Interno/my-app
npm install                       # Etapa 0 (una vez)
npx prisma migrate dev            # Etapa 2
npx prisma db seed                # Etapa 2
npm run dev                       # cualquier etapa
npm run lint                      # cierre de cualquier etapa
npx tsc --noEmit                  # cierre de cualquier etapa
npm run build                     # cierre de Etapa 9
```

---

## Fuera de alcance (MVP)

- Auth real (NextAuth/Auth.js) — la interfaz queda lista para upgrade trivial.
- `cacheComponents` / `"use cache"` (Next 16 feature). Se documenta para fase 2; el MVP corre sin caching opt-in.
- Integración real de WhatsApp / IA — los datos vienen del seed; los botones "Sincronizar WhatsApp" y "Resumen IA" son visuales/placeholder.
- Exportación a Excel / PDF.
- Notificaciones reales (badge `dot` estático).
- Mobile responsive completo (desktop-first ≥1280px; mobile como nice-to-have).
- Conexión con el `chatbot/` Python (vive como servicio aparte; integración futura).
