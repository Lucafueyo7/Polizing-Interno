# Modelo de datos optimizado — Polizing (v2)

## Contexto

Modelo rediseñado a partir del esquema actual (`prisma/schema.prisma`), aplicando: aplanado de tablas puente innecesarias (1:1 / 1:N), eliminación de campos calculados (3NF), uso de enums para valores cerrados, auditoría por actor (quién modificó + cuándo) y normalización de relaciones de pagos y siniestros como 1:N reales.

---

## 1. Decisiones de diseño aplicadas

### 1.1 — Aplanar relaciones 1:1 y 1:N que vivían en tablas puente
| Tabla puente eliminada | Naturaleza real | Solución |
|---|---|---|
| `poliza_cliente` | 1 cliente : N pólizas | `polizas.cliente_id` |
| `poliza_empresa` | 1 aseguradora : N pólizas | `polizas.aseguradora_id` |
| `tipo_poliza` | 1 tipo : N pólizas | `polizas.tipo_seguro_id` |
| `cobertura_poliza` + `coberturas` | 1 cobertura : N pólizas (subutilizado) | `polizas.cobertura` como **enum** (ver §1.4) |
| `siniestros_poliza` | 1 póliza : N siniestros | `siniestros.poliza_id` |
| `pagos_polizas` | 1 pago : N pólizas | `polizas.pago_id` |

Solo quedan relaciones N:M reales si aparecen — en este modelo, **ninguna**.

### 1.2 — Discriminador explícito de cliente
`clientes.tipo` (`enum: corporativo | persona`, NOT NULL). Las subtablas `clientes_corporativos` y `clientes_no_corporativos` se mantienen para los campos exclusivos.

### 1.3 — Estados y categorías como enum
`PolizaEstado`, `SiniestroEstado`, `PagoEstado`, `ClienteEstado`, `DocumentoTipo`, `CoberturaTipo`, `Rol`.

### 1.4 — `polizas.cobertura` como enum (no se elimina, se normaliza)
Reemplaza el String libre actual. Valores propuestos (a confirmar con el negocio):
`responsabilidad_civil | terceros_completo | todo_riesgo | basica | integral`.
Si la lista crece o necesita metadata, se promueve a tabla catálogo más adelante.

### 1.5 — Reformular `pagos.monto_total`
Se elimina el campo calculado del schema actual. Como ahora **1 pago agrupa N pólizas**, `pagos.monto` queda como el **total** de la operación (capturado al momento del pago). El detalle por póliza se reconstruye uniendo `polizas` por `pago_id` (con su `prima_mensual`). Se mantiene `pagos.cliente_id` porque el pago corporativo lo inicia un cliente (un batch agrupa pólizas de un mismo cliente).

### 1.6 — Auditoría por actor
Tablas de negocio (`clientes`, `polizas`, `siniestros`, `pagos`, `empresas_aseguradoras`) llevan:
- `modificado_por_id` (FK → `usuarios.id`, nullable): quién realizó el último cambio.
- `modificado_en` (Timestamptz, nullable): cuándo ocurrió ese cambio.

### 1.7 — Moneda
`polizas` y `pagos` reciben `moneda CHAR(3) DEFAULT 'ARS'`.

### 1.8 — Metadata real para documentos
`siniestro_documentos` recibe `url`, `mime_type`. `tamano` pasa a `tamano_bytes` (Int).

### 1.9 — `tipos_seguro` con `id` artificial
`id` autoincrement como PK; `nombre` queda `@unique`.

### 1.10 — Constraints temporales (CHECK SQL en migración)
- `polizas`: `fecha_fin_vigencia >= fecha_inicio_vigencia`
- `siniestros`: `fecha_reporte >= fecha_ocurrencia`

### 1.11 — Roles como enum
Se elimina la tabla `roles`. `usuarios.rol` pasa a enum `Rol`.

---

## 2. Modelo de tablas final

### 2.1 — `clientes`
| Campo | Tipo | Constraints |
|---|---|---|
| `id` | Int | PK, autoincrement |
| `tipo` | enum `ClienteTipo` | NOT NULL |
| `email` | String | nullable |
| `telefono` | String | nullable |
| `direccion` | String | nullable |
| `estado` | enum `ClienteEstado` | NOT NULL, default `activo` |
| `fecha_alta` | Timestamptz | default `now()` |
| `modificado_por_id` | Int | FK → `usuarios.id` SetNull, nullable |
| `modificado_en` | Timestamptz | nullable |

**Índices**: `tipo`, `estado`.

### 2.2 — `clientes_corporativos`
| Campo | Tipo | Constraints |
|---|---|---|
| `cliente_id` | Int | PK, FK → `clientes.id` cascade |
| `cuit` | String | `@unique`, NOT NULL |
| `razon_social` | String | NOT NULL |
| `contacto_nombre` | String | nullable |

### 2.3 — `clientes_no_corporativos`
| Campo | Tipo | Constraints |
|---|---|---|
| `cliente_id` | Int | PK, FK → `clientes.id` cascade |
| `dni` | String | `@unique`, NOT NULL |
| `nombre` | String | NOT NULL |
| `apellido` | String | NOT NULL |

### 2.4 — `empresas_aseguradoras`
| Campo | Tipo | Constraints |
|---|---|---|
| `id` | Int | PK, autoincrement |
| `razon_social` | String | NOT NULL |
| `cuit` | String | `@unique`, NOT NULL |
| `telefono` | String | nullable |
| `email` | String | nullable |
| `modificado_por_id` | Int | FK → `usuarios.id` SetNull, nullable |
| `modificado_en` | Timestamptz | nullable |

**Eliminados**: `color_hex`, `direccion`, `contacto_nombre`.

### 2.5 — `tipos_seguro`
| Campo | Tipo | Constraints |
|---|---|---|
| `id` | Int | PK, autoincrement |
| `nombre` | String | `@unique`, NOT NULL |
| `descripcion` | String | nullable |

### 2.6 — `polizas`
| Campo | Tipo | Constraints | Notas |
|---|---|---|---|
| `id` | Int | PK, autoincrement | |
| `numero_poliza` | String | `@unique`, NOT NULL | |
| `cliente_id` | Int | FK → `clientes.id`, NOT NULL | |
| `aseguradora_id` | Int | FK → `empresas_aseguradoras.id`, NOT NULL | |
| `tipo_seguro_id` | Int | FK → `tipos_seguro.id`, NOT NULL | |
| `pago_id` | Int | FK → `pagos.id` SetNull, nullable | **antes**: `pagos_polizas` (1 pago : N pólizas) |
| `cobertura` | enum `CoberturaTipo` | NOT NULL | |
| `estado` | enum `PolizaEstado` | NOT NULL | |
| `fecha_inicio_vigencia` | Timestamptz | NOT NULL | |
| `fecha_fin_vigencia` | Timestamptz | NOT NULL, CHECK ≥ inicio | |
| `suma_asegurada` | Decimal(15,2) | NOT NULL | |
| `prima_mensual` | Decimal(15,2) | NOT NULL | |
| `moneda` | Char(3) | default `'ARS'` | |
| `modificado_por_id` | Int | FK → `usuarios.id` SetNull, nullable | |
| `modificado_en` | Timestamptz | nullable | |

**Índices**: `cliente_id`, `aseguradora_id`, `tipo_seguro_id`, `estado`, `fecha_fin_vigencia`, `pago_id`, compuesto `(estado, fecha_fin_vigencia)`.

### 2.7 — `siniestros`
| Campo | Tipo | Constraints | Notas |
|---|---|---|---|
| `id` | Int | PK, autoincrement | |
| `poliza_id` | Int | FK → `polizas.id` cascade, NOT NULL | **antes**: `siniestros_poliza` |
| `numero` | String | `@unique`, NOT NULL | |
| `titulo` | String | NOT NULL | |
| `fecha_ocurrencia` | Timestamptz | NOT NULL | |
| `fecha_reporte` | Timestamptz | NOT NULL, CHECK ≥ ocurrencia | |
| `estado` | enum `SiniestroEstado` | NOT NULL, default `nuevo` | |
| `leido` | Boolean | default `false` | |
| `modificado_por_id` | Int | FK → `usuarios.id` SetNull, nullable | |
| `modificado_en` | Timestamptz | nullable | |

**Eliminado**: `fuente` (solo se reciben por WhatsApp).
**Tabla puente eliminada**: `siniestros_poliza`.
**Índices**: `poliza_id`, `estado`, `leido`, `fecha_reporte DESC`, compuesto `(estado, leido)`.

### 2.8 — `siniestro_documentos`
| Campo | Tipo | Constraints |
|---|---|---|
| `id` | Int | PK, autoincrement |
| `siniestro_id` | Int | FK → `siniestros.id` cascade, NOT NULL |
| `tipo` | enum `DocumentoTipo` | NOT NULL |
| `nombre` | String | NOT NULL |
| `url` | String | NOT NULL |
| `mime_type` | String | NOT NULL |
| `tamano_bytes` | Int | nullable |

**Eliminado**: `procesado_ia`.
**Índices**: `siniestro_id`.

### 2.9 — `pagos`
| Campo | Tipo | Constraints | Notas |
|---|---|---|---|
| `id` | Int | PK, autoincrement | |
| `cliente_id` | Int | FK → `clientes.id`, NOT NULL | quién inicia el pago |
| `monto` | Decimal(15,2) | NOT NULL | total del batch |
| `fecha_pago` | Timestamptz | nullable | se llena al validar |
| `estado` | enum `PagoEstado` | NOT NULL, default `pendiente` | |
| `metodo_pago` | String | nullable | |
| `moneda` | Char(3) | default `'ARS'` | |
| `modificado_por_id` | Int | FK → `usuarios.id` SetNull, nullable | |
| `modificado_en` | Timestamptz | nullable | |

**Relación con pólizas**: 1:N (1 pago agrupa N pólizas). La FK vive en `polizas.pago_id`. No hay tabla puente.
**Eliminados**: `fecha_emision`, `periodo`, `monto_total` (calculado), `concepto` (vive implícito en cada póliza vinculada), `comprobante`, `cbu`.
**Índices**: `cliente_id`, `estado`, `fecha_pago DESC`, compuesto `(cliente_id, estado)`.

### 2.10 — `usuarios`
| Campo | Tipo | Constraints |
|---|---|---|
| `id` | Int | PK, autoincrement |
| `dni` | String | `@unique`, NOT NULL |
| `email` | String | `@unique`, NOT NULL |
| `nombre_completo` | String | NOT NULL |
| `rol` | enum `Rol` | NOT NULL |

**Eliminada**: tabla `roles` (reemplazada por enum `Rol`).

---

## 3. Enums

```
ClienteTipo       → corporativo | persona
ClienteEstado     → activo | baja
PolizaEstado      → vigente | proxima | vencida | anulada | renovada
CoberturaTipo     → responsabilidad_civil | terceros_completo | todo_riesgo | basica | integral
SiniestroEstado   → nuevo | tramite | cerrado
DocumentoTipo     → img | pdf
PagoEstado        → pendiente | validado | rechazado
Rol               → productor | administrativo
```

> Los valores de `CoberturaTipo` y `Rol` son una propuesta basada en el seed actual; ajustables si el dominio define otros.

---

## 4. Resumen estructural

**Tablas eliminadas (7)**:
`poliza_cliente`, `poliza_empresa`, `tipo_poliza`, `cobertura_poliza`, `coberturas`, `siniestros_poliza`, `pagos_polizas`, `roles`.

(Total: pasa de **17 tablas → 10 tablas**.)

**Campos eliminados clave**:
- `empresas_aseguradoras`: `color_hex`, `direccion`, `contacto_nombre`
- `polizas`: `fecha_emision`, `tarjeta_circulacion_poliza`, `numero_cuota`
- `siniestros`: `fuente`, `descripcion_hechos`, `ai_summary`
- `siniestro_documentos`: `procesado_ia`, `hash`
- `pagos`: `fecha_emision`, `periodo`, `monto_total`, `concepto`, `comprobante`, `cbu`
- `usuarios`: `password_hash` (campo de implementación, no expuesto en el modelo de datos)

**Campos transformados**:
- Estados, fuente, tipo de doc, rol, cobertura → enum
- `tamano` (String) → `tamano_bytes` (Int)
- `usuarios.dni` (PK) → `id` artificial PK + `dni @unique`
- `tipos_seguro.nombre` (PK) → `id` artificial PK + `nombre @unique`
- Auditoría `created_at`/`updated_at` → `modificado_por_id` (FK → usuarios) + `modificado_en`

**Campos agregados**:
- `clientes.tipo` (discriminador)
- `modificado_por_id` + `modificado_en` en `clientes`, `polizas`, `siniestros`, `pagos`, `empresas_aseguradoras`
- `polizas.moneda`, `pagos.moneda`
- `siniestro_documentos.url`, `mime_type`

---

## 5. Próximos pasos (post-aprobación)

1. Reescribir `prisma/schema.prisma` reflejando este modelo.
2. Generar migración (`npx prisma migrate dev --name reestructura_modelo`).
3. Adaptar `prisma/seed-data.ts` y `prisma/seed.ts`.
4. Adaptar `lib/data/_mappers.ts` y `lib/data/types.ts`.
5. Validar con `npx prisma validate` y correr seed.

---

## Archivos a modificar

- `prisma/schema.prisma`
- `prisma/seed.ts`
- `prisma/seed-data.ts`
- `lib/data/_mappers.ts`
- `lib/data/types.ts`
- `lib/data/{clientes,polizas,siniestros,aseguradoras,pagos,kpis}.ts`
