# Polizing — Golden Path Smoke Test

Checklist manual para validar el flujo completo end-to-end de la app.
Sirve como criterio de aceptación de la Etapa 9 (hardening).

**Pre-requisitos**
- `npm run dev` corriendo en http://localhost:3000.
- DB seeded (`npm run db:seed` deja 12 clientes / 5 aseguradoras / 18 pólizas / 8 siniestros / 5 pagos).
- Browser con localStorage limpio (logout previo).

---

## 1. Login + auth guard

- [ ] Navegar a `/`.
- [ ] Redirige a `/login`.
- [ ] El aside izquierdo muestra el pitch con stats.
- [ ] Click en "Mariano Pereyra" (demo user, productor).
- [ ] Redirige a `/dashboard` con su nombre en el sidebar.
- [ ] Toggle ☀️/🌙 cambia tema; recargar mantiene la elección (sin FOUC).

## 2. Dashboard real

- [ ] `/dashboard` muestra 4 KPIs con números del seed:
  - Clientes activos: **11**
  - Pólizas vigentes (vigente+proxima): **~15**
  - Siniestros nuevo+trámite: **6**
  - Prima mensual ARS (suma).
- [ ] Cada KPI tiene sparkline render (no roto).
- [ ] "Siniestros pendientes" lista los 2 nuevos del seed; click navega a `/siniestros/[id]`.
- [ ] Distribución por aseguradora: 5 barras con colores brand (palette determinística).
- [ ] Sidebar muestra badges en Siniestros (2 nuevos) y Pólizas (count por vencer).

## 3. Clientes — search + detalle

- [ ] `/clientes` lista 12 clientes con avatars.
- [ ] Search "Sofía" → 1 fila (Sofía Mansilla).
- [ ] Filtros segmented y estado actualizan la URL (`?tipo=...&estado=...`).
- [ ] Reload mantiene los filtros.
- [ ] Click en una fila → `/clientes/[id]` con header (avatar XL + badges + ident), info card, resumen (3 KPIs), tabs `Contrataciones (n)` / `Siniestros (n)` / `Actividad`.
- [ ] Cambiar tab actualiza `?tab=...`.

## 4. Clientes ABM corp

- [ ] Click "Nuevo cliente" → modal con backdrop blur.
- [ ] Toggle "Corporativo" → campos cambian (Razón social + CUIT + Contacto).
- [ ] Submit con CUIT inválido → error inline + toast de error.
- [ ] Submit con CUIT válido (ej. `30-71045892-7`) → toast success → redirect a `/clientes/[id]` y la lista refleja la nueva fila al volver.
- [ ] Editar cliente desde detalle (`?modal=edit`) → modal prefilled → submit refleja cambios.

## 5. Pólizas — link cruzado desde cliente

- [ ] En `/clientes/[id]`, click "Nueva póliza" → navega a `/polizas?modal=create&newForCliente=ID`.
- [ ] Modal abre con cliente prefillado en el select.
- [ ] Submit válido → toast → redirect a `/polizas/[id]`.

## 6. Pólizas — tabs y vencimiento

- [ ] `/polizas` lista 18 pólizas con counts en cada tab.
- [ ] Tab "Próx. a vencer" filtra las que vencen ≤60 días.
- [ ] Vencimiento hint en rojo si ≤15 días, naranja si ≤60 (solo en `vigente|proxima`).
- [ ] Footer muestra "Prima total" recalculada con cada filtro.
- [ ] Click en número de póliza → `/polizas/[id]` con vinculación, datos, vigencia.

## 7. Siniestros — inbox parallel routes

- [ ] `/siniestros` redirige al primer pendiente; lista a la izq + detalle a la der.
- [ ] Click en otro item: URL cambia a `/siniestros/[id]`. **La lista NO re-renderiza** (parallel routes), solo el detalle.
- [ ] Tabs Todos / Nuevos / En trámite / Cerrados filtran con counts correctos.
- [ ] Search "choque" o similar filtra la lista.
- [ ] Cargar un siniestro `nuevo`: el bold del item desaparece tras el `marcar-leido` automático.
- [ ] Detalle muestra AI summary, póliza vinculada con link a `/polizas/[id]`, descripción, docs grid, timeline.
- [ ] Click "Ver póliza" en póliza vinculada → navega a `/polizas/[id]`.
- [ ] Click "Aprobar trámite" en uno `nuevo` → estado cambia a `tramite`, toast, item se mueve de tab.

## 8. Siniestros — alta nueva

- [ ] Click "Nuevo siniestro" → modal abre con número auto-generado `SIN-YYYY-NNNN`.
- [ ] Cliente select muestra solo activos.
- [ ] Elegir cliente → póliza select se habilita y filtra solo las del cliente.
- [ ] Submit válido → toast → redirect a `/siniestros/[newId]`.
- [ ] El siniestro aparece en la lista con badge "Nuevo".

## 9. Pagos — validación

- [ ] `/pagos` redirige al primer pendiente.
- [ ] Summary KPI strip arriba con "Pendientes de validación" en card primary fuerte.
- [ ] Segmented Pendientes / Validados / Todos filtra con counts en label.
- [ ] Click en pago de la lista: URL cambia, **lista NO re-renderiza** (parallel routes).
- [ ] Detalle muestra método, comprobante, CBU, items con dot color de aseguradora, totales subtotal/IVA/total.
- [ ] Click "Validar pago" → confirm → toast → estado cambia a `validado`, banner verde, summary recalcula, fila se mueve de tab.
- [ ] Click "Rechazar" en otro pendiente → confirm → toast → banner rojo.

## 10. Logout

- [ ] Click en logout (sidebar bottom).
- [ ] Redirige a `/login`, cookie borrada.
- [ ] Intentar `/dashboard` directamente → redirige a `/login`.

---

## Métricas de calidad

Verificar antes de cerrar la sesión de testing:

- [ ] `npm run lint` sin errores (warnings de RHF compiler son aceptables).
- [ ] `npx tsc --noEmit` sin errores.
- [ ] `npm run build` limpio. Todas las rutas dinámicas (`/aseguradoras`, `/clientes`, `/clientes/[id]`, `/dashboard`, `/pagos`, `/pagos/[id]`, `/polizas`, `/polizas/[id]`, `/siniestros`, `/siniestros/[id]`) deben aparecer en PPR (`◐`) con `Revalidate 1m / Expire 1h`.
- [ ] `find app components lib -type f \( -name "*.ts" -o -name "*.tsx" \) | xargs wc -l | sort -rn | head -10` — ningún archivo de la app supera 350 LOC.
- [ ] Toggle dark/light: todos los tokens cambian, ningún componente queda con un color hardcoded fuera de paleta.

## Cache invalidation

Smoke quick para verificar que `cacheTag` + `updateTag` están bien wireados:

- [ ] Crear cliente → la lista en `/clientes` lo muestra sin reload duro.
- [ ] Crear póliza → `/polizas` la muestra; el conteo de "Pólizas activas" del cliente sube en `/clientes/[id]` (tag `clientes` invalida).
- [ ] Validar pago → summary y counts recalculan inmediatamente.
- [ ] Aprobar trámite de siniestro → counts y badges del sidebar refrescan.
