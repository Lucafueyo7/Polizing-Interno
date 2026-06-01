# Prisma en Polizing-Interno

Documentación técnica completa sobre cómo está configurado y usado Prisma en este proyecto.

---

## 1. Versión y setup

**Prisma 7** — versión con breaking changes respecto a Prisma 5/6.

### Dependencias instaladas (en `my-app/`)

```bash
npm install --save-dev prisma dotenv
npm install @prisma/client @prisma/adapter-pg pg @types/pg
```

| Paquete | Rol |
|---|---|
| `prisma` | CLI (migrations, generate, db pull) |
| `@prisma/client` | Runtime del cliente |
| `@prisma/adapter-pg` | Driver adapter para PostgreSQL |
| `pg` | Driver nativo de PostgreSQL para Node.js |
| `dotenv` | Carga `.env` en `prisma.config.ts` |

---

---

## 2. Base de datos

**Supabase PostgreSQL** — hosted en AWS us-east-1.

Las URLs viven en `my-app/.env`:

```env
# Conexión pooled (pgbouncer) — para queries normales desde la app
DATABASE_URL="postgresql://postgres.xxx:password@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Conexión directa — para introspección y migraciones
DIRECT_URL="postgresql://postgres.xxx:password@aws-1-us-east-1.pooler.supabase.com:5432/postgres"
```

### Diferencia entre URLs y Límites

| URL | Puerto | Límite | Rol Principal |
| :--- | :--- | :--- | :--- |
| **DATABASE_URL** (Pooler) | 6543 | ~10,000 (Virtuales) | Ejecución de la App (Next.js) |
| **DIRECT_URL** (Directa) | 5432 | **60** (Reales) | Tareas de administrador (Prisma CLI) |

> [!IMPORTANT]
> **¿Por qué dos URLs?**
> El Pooler (PgBouncer) multiplexea conexiones para soportar miles de usuarios, pero no soporta el protocolo de migraciones ni bloqueos de seguridad. La URL directa es obligatoria para `prisma db pull` y `prisma migrate`.

---

## 3. ¿Para qué sirve el Schema Prisma?

El archivo `prisma/schema.prisma` es el plano arquitectónico del proyecto y cumple tres funciones críticas:

1.  **Traductor de Tipos:** Genera el código TypeScript para que tengas autocompletado y seguridad de tipos en tu editor (IntelliSense).
2.  **Fuente de Verdad:** Es un documento legible por humanos que describe toda la estructura de la base de datos sin necesidad de entrar a Supabase.
3.  **Gestor de Sincronización:** Permite que los cambios en el código se reflejen en la base de datos (`migrate`) y viceversa (`db pull`).

---

## 4. Cómo modificar la base de datos (Migraciones)

Si necesitas agregar un atributo a una tabla o crear una nueva, sigue este flujo:

1.  **Modificar el Schema:** Edita `prisma/schema.prisma` agregando el campo o el nuevo modelo.
2.  **Ejecutar Migrate:** Corre el siguiente comando en la terminal:
    ```bash
    npx prisma migrate dev --name descripcion_del_cambio
    ```
    *Este comando crea un archivo SQL de historial, impacta la base de datos en Supabase y regenera el cliente TypeScript.*

> [!TIP]
> Si el comando falla por temas de conexión en Supabase, puedes forzar el uso de la URL directa:
> `npx prisma migrate dev --name tu_cambio --url "TU_DIRECT_URL"`

---

## 5. Archivos de configuración de la App

### `prisma/schema.prisma`

Define los modelos de la base de datos. Generado automáticamente via `prisma db pull`.

```prisma
generator client {
  provider = "prisma-client"
  output   = "../app/generated/prisma"   // ← cliente se genera DENTRO del app de Next.js
}

datasource db {
  provider = "postgresql"
  // ⚠️ En Prisma 7 la URL NO va aquí — va en prisma.config.ts
}
```

### `prisma.config.ts`

Archivo de configuración exclusivo de Prisma 7. Reemplaza la URL en el schema.

```typescript
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    url: process.env["DATABASE_URL"],  // pool de Supabase
    // ⚠️ directUrl NO existe en este tipo en Prisma 7
    // Para migraciones, pasar --url manualmente (ver sección 5)
  },
});
```

---

## 4. Modelos de la base de datos

Se introspectaron **17 tablas** desde Supabase con `prisma db pull`.

### Diagrama de relaciones

```
clientes
  ├── clientes_corporativos      (1:1 — empresas: CUIT / razón social)
  ├── clientes_no_corporativos   (1:1 — personas físicas: DNI / nombre)
  └── poliza_cliente             (1:N — pólizas del cliente)

polizas
  ├── poliza_cliente             → clientes
  ├── poliza_empresa             → empresas_aseguradoras
  ├── tipo_poliza                → tipos_seguro
  ├── cobertura_poliza           → coberturas
  ├── pagos_polizas              → pagos
  └── siniestros_poliza          → siniestros

siniestros
  └── siniestros_poliza          → polizas

usuarios
  └── roles

tipos_seguro   (catálogo: "auto", "hogar", "vida", etc.)
coberturas     (catálogo de coberturas disponibles)
empresas_aseguradoras
```

### Descripción de cada tabla

| Tabla | Descripción |
|---|---|
| `clientes` | Datos base compartidos (email, teléfono, dirección, estado) |
| `clientes_corporativos` | Extensión para empresas: CUIT único + razón social |
| `clientes_no_corporativos` | Extensión para personas: DNI + nombre + apellido |
| `polizas` | Póliza de seguro: número, fechas, estado, suma asegurada, cuotas |
| `poliza_cliente` | Tabla junction — asigna una póliza a un cliente |
| `poliza_empresa` | Tabla junction — asigna una póliza a una aseguradora |
| `tipo_poliza` | Tabla junction — asigna un tipo de seguro a una póliza |
| `cobertura_poliza` | Tabla junction — asigna una cobertura a una póliza |
| `coberturas` | Catálogo de coberturas disponibles |
| `tipos_seguro` | Catálogo de tipos de seguro (PK = nombre: "auto", "hogar", etc.) |
| `empresas_aseguradoras` | Compañías de seguros: CUIT, razón social, contacto |
| `pagos` | Registros de pago: monto, fecha, método |
| `pagos_polizas` | Tabla junction — vincula un pago a una póliza |
| `siniestros` | Siniestro: fecha ocurrencia, descripción, estado, documentos adjuntos |
| `siniestros_poliza` | Tabla junction — vincula un siniestro a una póliza |
| `roles` | Roles de usuario del sistema (ej: admin, operador) |
| `usuarios` | Usuarios internos del sistema: DNI (PK), email, password hash, rol |

> ⚠️ Todas las tablas tienen **Row Level Security (RLS)** activado en Supabase.
> Prisma puede leer/escribir normalmente desde el backend, pero si usás el cliente
> de Supabase desde el frontend necesitás configurar las políticas RLS.

---

## 5. Comandos útiles

### Introspeccionar la base de datos (cuando cambian tablas en Supabase)

```bash
# Usar la URL directa (pgbouncer no funciona para esto)
npx prisma db pull --url "postgresql://postgres.xxx:password@aws-1-us-east-1.pooler.supabase.com:5432/postgres"
```

### Regenerar el cliente TypeScript (después de cambios en schema.prisma)

```bash
npx prisma generate
```

> El cliente se genera en `app/generated/prisma/` — **no editar manualmente**.

### Ver el schema en el navegador (Prisma Studio)

```bash
npx prisma studio
```

### Aplicar una migración

```bash
# Crear y aplicar una migración nueva
npx prisma migrate dev --name nombre_descripcion

# Solo aplicar migraciones pendientes (producción)
npx prisma migrate deploy
```

---

## 6. Cliente Prisma — Singleton

**Archivo:** `app/lib/prisma.ts`

En Prisma 7 el cliente **requiere un Driver Adapter** — ya no lee la URL de conexión
directamente. Se usa `PrismaPg` con un pool de `pg`.

```typescript
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

// Singleton — evita múltiples conexiones en hot-reload de Next.js
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

> **¿Por qué singleton?** Next.js en desarrollo hace hot-reload del código pero mantiene
> el proceso Node.js vivo. Sin el singleton, cada reload crearía un nuevo pool de
> conexiones hasta agotar el límite de Supabase.

---

## 7. Data Controllers

Tres archivos en `app/lib/` que exponen funciones listas para usar en Server Components y API Routes.

### `data-clientes.ts` — 11 funciones

```typescript
import {
  getClientes,
  getClienteById,
  getClienteByDni,
  getClienteByCuit,
  getClientesByEmail,
  getClientesByEstado,
  getClientesCorporativos,
  getClientesNoCorporativos,
  createCliente,
  updateCliente,
  deleteCliente,
} from "@/app/lib/data-clientes";
```

### `data-polizas.ts` — 13 funciones

```typescript
import {
  getPolizas,
  getPolizaById,
  getPolizaByNumero,
  getPolizasByCliente,
  getPolizasByEstado,
  getPolizasActivas,
  getPolizasByTipo,
  getPolizasByAseguradora,
  getPolizasProximasAVencer,
  createPoliza,
  updatePoliza,
  cancelarPoliza,
  deletePoliza,
} from "@/app/lib/data-polizas";
```

### `data-siniestros.ts` — 16 funciones

```typescript
import {
  getSiniestros,
  getSiniestroById,
  getSiniestrosByPoliza,
  getSiniestrosByEstado,
  getSiniestrosPendientes,
  getSiniestrosEnProceso,
  getSiniestrosByCliente,
  getSiniestrosByRangoDeFechas,
  getEstadisticasSiniestros,
  createSiniestro,
  updateSiniestro,
  cambiarEstadoSiniestro,
  agregarDocumentosSiniestro,
  vincularSiniestroAPoliza,
  deleteSiniestro,
} from "@/app/lib/data-siniestros";
```

---

## 8. Ejemplo de uso en un Server Component

```typescript
// app/dashboard/page.tsx
import { getPolizasActivas, getPolizasProximasAVencer } from "@/app/lib/data-polizas";
import { getSiniestrosPendientes, getEstadisticasSiniestros } from "@/app/lib/data-siniestros";
import { getClientes } from "@/app/lib/data-clientes";

export default async function DashboardPage() {
  // Las queries corren en paralelo en el servidor
  const [polizasActivas, proximas, siniestrosPendientes, stats, clientes] = await Promise.all([
    getPolizasActivas(),
    getPolizasProximasAVencer(30),       // vencen en los próximos 30 días
    getSiniestrosPendientes(),
    getEstadisticasSiniestros(),         // { estado, total }[]
    getClientes(),
  ]);

  return (
    <main>
      <p>Pólizas activas: {polizasActivas.length}</p>
      <p>Vencen pronto: {proximas.length}</p>
      <p>Siniestros pendientes: {siniestrosPendientes.length}</p>
    </main>
  );
}
```

---

## 9. Estructura de archivos final

```
my-app/
├── .env                          ← DATABASE_URL y DIRECT_URL (no commitear)
├── prisma.config.ts              ← Config de Prisma 7 (URL, schema path)
├── prisma/
│   └── schema.prisma             ← Modelos (generado por db pull)
└── app/
    ├── generated/
    │   └── prisma/               ← Cliente TypeScript generado (no editar)
    │       ├── client.ts
    │       ├── models/
    │       └── ...
    └── lib/
        ├── prisma.ts             ← Singleton PrismaClient
        ├── data-clientes.ts      ← Controlador Clientes
        ├── data-polizas.ts       ← Controlador Pólizas
        └── data-siniestros.ts    ← Controlador Siniestros
```
