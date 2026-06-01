# Módulo Noticias

Scraper de noticias de [Asegurando Digital](https://asegurandodigital.com.ar/) integrado al dashboard interno. Trae las últimas 12 noticias, las persiste en Postgres y las muestra en `/noticias`.

---

## 1. Arquitectura — ETL

El módulo implementa un pipeline **ETL** (Extract → Transform → Load) ejecutado on-demand y gobernado por la caché de Next.js 16.

```
[Usuario entra a /noticias]
        │
        ▼
app/(app)/noticias/page.tsx  (server component)
        │  await getNoticias()
        ▼
lib/data/noticias.ts  ── "use cache" + cacheLife("hours") + cacheTag("noticias")
        │   ¿caché válida? ── sí ──► retorna lo cacheado (DB no se toca)
        │   no
        ▼
   refreshSnapshot()
        │
        ├─► EXTRACT: lib/scrapers/asegurando-digital.ts
        │      fetch("https://asegurandodigital.com.ar/feed/")  (RSS, no HTML)
        │      timeout 10s, User-Agent identificable
        │
        ├─► TRANSFORM: cheerio (xmlMode) parsea cada <item>
        │      titulo, url, fecha, categoría, primera imagen, resumen (280 chars)
        │      Zod valida cada item → descarta los inválidos
        │
        └─► LOAD: prisma.$transaction([
                    prisma.noticias_scrapeadas.deleteMany({}),
                    prisma.noticias_scrapeadas.createMany({ data })
                  ])
              (pisa el snapshot anterior — atomic)
        ▼
   prisma.noticias_scrapeadas.findMany({ orderBy: [publicada_en, scrapeada_en] desc, take: 12 })
        ▼
NoticiasGrid → NoticiaCard[]  (link externo, target="_blank")
```

### ¿Por qué ETL y no ELT?

La transformación (parseo de XML, limpieza de HTML, validación Zod) ocurre **en memoria antes** de tocar la DB. No guardamos el feed crudo. Es ETL clásico — útil porque:

- La DB sólo contiene datos limpios y validados (no garbage XML).
- El frontend lee filas tipadas sin lógica de parseo.
- Si el feed se rompe, el Transform lo descarta y el snapshot anterior queda intacto.

---

## 2. Fuente de datos: RSS feed (no HTML)

Originalmente el plan era scrapear el HTML del home. **Pero el sitio expone un feed RSS en `/feed/`** — descubierto en `https://asegurandodigital.com.ar/feed/`. Cambiamos a RSS porque es:

- **Estable**: la estructura XML (`<title>`, `<link>`, `<pubDate>`, `<description>`, `<content:encoded>`, `<category>`) no cambia con rediseños del sitio.
- **Completo**: trae fechas en RFC 2822, body HTML embebido (de donde extraemos la primera imagen), y categorías.
- **Permitido**: `robots.txt` sólo bloquea `/wp-admin/`. El feed es público.

### Mapeo RSS → tabla

| Item RSS | Columna `noticias_scrapeadas` |
| --- | --- |
| `<title>` | `titulo` |
| `<link>` | `url_origen` (unique) |
| `<pubDate>` (RFC 2822) | `publicada_en` (timestamptz) |
| `<category>` (primero) | `categoria` |
| `<description>` → strip HTML + 280 chars | `resumen` |
| Primera `<img src>` en `<content:encoded>` | `imagen_url` |

---

## 3. Archivos del módulo

### Nuevos

```
my-app/
├── lib/
│   ├── scrapers/
│   │   └── asegurando-digital.ts        ← Extract + Transform puro (sin side effects)
│   └── data/
│       └── noticias.ts                  ← Orquesta scrape + Load + caché. Exporta getNoticias()
└── app/(app)/noticias/
    ├── page.tsx                         ← Server component, llama getNoticias()
    ├── _actions/
    │   └── refresh.ts                   ← Server action: updateTag("noticias")
    └── _components/
        ├── noticias-grid.tsx            ← Grid responsive
        ├── noticia-card.tsx             ← Card con imagen, título, resumen, fecha, categoría
        ├── noticias-empty-state.tsx     ← Fallback si no hay datos
        └── refresh-noticias-button.tsx  ← Client component con useTransition
```

### Modificados

| Archivo | Cambio |
| --- | --- |
| `prisma/schema.prisma` | Nuevo modelo `noticias_scrapeadas` (9 columnas + 2 índices) |
| `lib/cache/tags.ts` | Agrega `noticias: "noticias"` a `CACHE_TAGS` |
| `app/(app)/_components/sidebar-nav.ts` | Item "Noticias" en el sidebar con ícono `Newspaper` |
| `components/icons.ts` | Re-exporta `Newspaper` de lucide-react |
| `package.json` | Agrega `cheerio@^1.2.0` |

---

## 4. Modelo Prisma

```prisma
model noticias_scrapeadas {
  id           Int       @id @default(autoincrement())
  url_origen   String    @unique
  titulo       String
  resumen      String?
  imagen_url   String?
  publicada_en DateTime? @db.Timestamptz(6)
  categoria    String?
  fuente       String    @default("Asegurando Digital")
  scrapeada_en DateTime  @default(now()) @db.Timestamptz(6)

  @@index([publicada_en(sort: Desc)])
  @@index([scrapeada_en(sort: Desc)])
}
```

- `url_origen` es **unique**: evita duplicados intra-snapshot y permite tracking estable.
- `fuente` queda para soportar múltiples scrapers a futuro sin migración.
- `scrapeada_en` es el timestamp de la corrida del ETL (auditoría / debug).
- Los índices descendentes optimizan el `ORDER BY publicada_en DESC` de la query principal.

---

## 5. Caché — Next.js 16 Cache Components

`getNoticias()` está envuelto con `"use cache"` + `cacheLife("hours")` + `cacheTag(CACHE_TAGS.noticias)`.

Perfil **`hours`** de Next.js 16:

| Propiedad | Valor |
| --- | --- |
| `stale` (cliente) | 5 minutos |
| `revalidate` (servidor) | **1 hora** |
| `expire` | 1 día |

Esto implica:

- El scraping **real** ocurre como máximo **una vez por hora**, sin importar cuántos usuarios entren a `/noticias`.
- Entre re-scrapes, todos sirven el snapshot cacheado en memoria (la DB también queda como respaldo persistente).
- A los 5 min, el cliente revalida con el servidor pero seguirá viendo el snapshot hasta que pase la hora.

### Invalidación manual

El botón **"Actualizar"** en el header dispara `refreshNoticias()` — un server action que llama `updateTag("noticias")`. Esto:

- Marca la entrada como **inmediatamente expirada** (no stale-while-revalidate).
- La próxima lectura de `getNoticias()` re-ejecuta el ETL → trae feed → pisa la tabla → devuelve fresco.

> `updateTag` reemplaza a `revalidateTag(tag)` en Next 16. `revalidateTag` ahora requiere un segundo argumento (`profile`) y está pensado para invalidaciones background. Para "read-your-own-writes" — que es lo que queremos al apretar Actualizar — `updateTag` es la API correcta.

---

## 6. Tolerancia a fallas

Si el feed RSS está caído, timea-out, devuelve XML inválido o ningún item supera la validación Zod:

1. El `try/catch` dentro de `refreshSnapshot()` atrapa el error y lo loguea.
2. **La tabla no se vacía** — `deleteMany` sólo corre si el scrape devolvió >0 items.
3. La query siguiente lee lo que haya en DB (último snapshot exitoso).
4. El usuario ve noticias viejas en lugar de una pantalla vacía o un crash.

Si la DB está vacía y el scrape falla, la página renderiza `<NoticiasEmptyState>`.

---

## 7. Cómo aplicar a la DB

El proyecto **no usa `prisma migrate`** — no hay carpeta `prisma/migrations/`. Convención: `prisma db push` para sincronizar el schema.

```bash
cd my-app
pnpm exec prisma db push       # Sincroniza schema.prisma → DB
pnpm exec prisma generate      # Regenera client TS (suele correr solo)
```

El comando ya se corrió cuando se creó este módulo. La tabla `noticias_scrapeadas` existe en Supabase con la estructura definida.

---

## 8. Cómo probar end-to-end

```bash
cd my-app
pnpm dev
```

Navegar a `http://localhost:3000/noticias`. Flujo esperado:

1. **Primera carga**: ~2-4 segundos (fetch RSS + parse + insert + read). Render del grid con 12 cards.
2. **Cargas siguientes (<1h)**: instantáneo. La DB **no** se toca, viene de caché in-memory de Next.
3. **Click en card**: abre el artículo en `asegurandodigital.com.ar` en nueva pestaña.
4. **Botón "Actualizar"**: spinner → re-scrape → grid se actualiza.

### Verificaciones rápidas en DB

```sql
SELECT count(*) FROM noticias_scrapeadas;                    -- → 12 (post primera carga)
SELECT max(scrapeada_en) FROM noticias_scrapeadas;           -- → muy reciente
SELECT titulo, publicada_en FROM noticias_scrapeadas
  ORDER BY publicada_en DESC LIMIT 5;                        -- → últimas 5 noticias
```

### Logs útiles

Si el scrape falla, en la consola del dev server aparece:

```
[noticias] scrape falló, sirviendo último snapshot de DB <error>
```

Para verbose cache logging de Next:

```bash
NEXT_PRIVATE_DEBUG_CACHE=1 pnpm dev
```

---

## 9. Dependencias añadidas

| Paquete | Versión | Rol |
| --- | --- | --- |
| `cheerio` | ^1.2.0 | Parser XML/HTML para extraer items del feed (modo XML estricto) |

`zod` y `next/cache` ya estaban en el proyecto.

---

## 10. Troubleshooting

**`PrismaClientKnownRequestError: Authentication failed`** después de cambiar credenciales en `.env`
→ El dev server cachea el cliente Prisma en `globalThis` (`lib/prisma.ts:31`) para sobrevivir al HMR. Reiniciar `pnpm dev`.

**`XX000 (ECIRCUITBREAKER) too many authentication failures`**
→ Supabase pgbouncer bloquea el pooler tras varios fallos de auth. Esperar 2-5 min, o reiniciar el pooler en *Supabase → Project Settings → Database → Connection pooling*.

**`/noticias` muestra empty state aunque el sitio fuente está online**
→ Posibles causas:
  - Selectores RSS cambiaron (improbable — XML estándar).
  - Validación Zod descarta todo (revisar logs).
  - DB vacía + scrape falló (revisar consola por `[noticias] scrape falló`).

**El botón "Actualizar" no trae datos nuevos**
→ Verificar que el feed RSS realmente tenga novedades. Si el contenido es el mismo, el `deleteMany + createMany` igual corre pero la UI se ve idéntica.

**Imágenes no cargan**
→ El card usa `<img>` plano (no `next/image`), así que no requiere configuración de `remotePatterns`. Si querés `next/image`, agregá `asegurandodigital.com.ar` a `next.config.ts → images.remotePatterns`.

---

## 11. Diseño de extensión a futuro

Si se quisiera agregar otra fuente (ej. `riesgosonline.com.ar`):

1. Crear `lib/scrapers/riesgos-online.ts` con la misma firma `(): Promise<NoticiaScrapeada[]>`.
2. En `lib/data/noticias.ts`, paralelizar:
   ```ts
   const [a, b] = await Promise.allSettled([scrapeAsegurandoDigital(), scrapeRiesgosOnline()]);
   const scraped = [...(a.status === "fulfilled" ? a.value : []), ...(b.status === "fulfilled" ? b.value : [])];
   ```
3. El campo `fuente` ya está preparado para distinguirlas.
4. El `deleteMany` actual es global — habría que cambiarlo a `deleteMany({ where: { fuente: "X" } })` para que el fallo de un scraper no borre el snapshot del otro.
