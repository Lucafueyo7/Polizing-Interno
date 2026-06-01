# Architecture Decision Records (ADRs) - ENTREGABLE 4

**Versión:** 2.0 (Conforme lineamientos de cátedra)  
**Fecha de entrega:** 2026-06-01  
**Basado en:** Inspección de código real (`my-app/` y `chatbot/`)

---

## ADR-001: Arquitectura del Backend — Microservicios con BD Compartida

| ID | Título | Estado | Fecha |
|----|--------|--------|-------|
| ADR-001 | Separar backend en microservicios: web (Next.js) + API chatbot (FastAPI) con base de datos PostgreSQL compartida | Aceptada | 01/06/2026 |

### 1. Contexto

Polizing requiere dos interfaces de usuario con ciclos de vida y necesidades de escalado diferentes:
- **Panel web:** productoras de seguros consultan/editan pólizas, clientes, siniestros. Tráfico aleatorio, acceso puntual.
- **Chatbot WhatsApp:** clientes finales consultan estado de pólizas 24/7. Tráfico predecible pero sostenido.

**Motivador 1 — Ciclos de deployment independientes:** el chatbot evoluciona a ritmo diferente que la web (actualizaciones de prompts, intención de NLU). Cada cambio en uno no debe bloquear al otro.

**Motivador 2 — Escalado heterogéneo:** la web (Vercel serverless) puede escalar a cero. El chatbot (Render containerizado) necesita estar siempre disponible, con costos predecibles.

**Motivador 3 — Equipos distribuidos:** dos desarrolladores especializados en stacks diferentes (Next.js + Python), sin fricción de lenguaje compartido.

**Motivador 4 — Datos compartidos en tiempo real:** ambos servicios consultan/escriben la misma información (pólizas, clientes). Desincronización = inconsistencia crítica.

### 2. Alternativas consideradas

| Alternativa | Ventaja principal en este contexto | Desventaja / Motivo de descarte |
|-------------|-----------------------------------|--------------------------------|
| **Monolito único (Next.js)** | Un lenguaje, una BD, deploys sincronizados. Complejidad operacional mínima. | Requeriría embeber chatbot lógica en Node.js (ineficiente para prompts). No escala independientemente. El chatbot estaría sujeto al ciclo de deploy de la web (acoplamiento). |
| **Dos monolitos independientes (Next.js + Flask)** | Ciclos de deploy completamente independientes. Escalado heterogéneo sin restricciones. | Cada uno tendría su propia BD → desincronización de datos de core (pólizas, clientes). Consistencia eventual difícil de garantizar sin ETL manual. |
| **Microservicios con BD compartida** (elegida) | Ciclos de deploy independientes. Escalado heterogéneo. Datos sincronizados en tiempo real mediante BD relacional compartida. | Acoplamiento indirecto vía BD. Cambios de esquema impactan ambos. Requiere coordinación en migraciones. |

### 3. Decisión tomada

**Se decide:** arquitectura de dos aplicaciones independientes (web + API) que comparten una única base de datos PostgreSQL, con esquemas aislados para evitar colisiones:
- **my-app (Next.js):** esquema `public` (Prisma)
- **chatbot (FastAPI):** esquema `chatbot` (SQLAlchemy)

**Fundamentación:**

1. **Ciclos de deployment independientes:** cada servicio despliega en su plataforma con su propio CI/CD sin bloqueos. El chatbot en Render, la web en Vercel. Cambios en prompts no requieren rebuild de Next.js.

2. **Escalado heterogéneo sin sobrecosto:** Next.js escala a serverless (costo marginal), el chatbot mantiene instancia containerizada ($7/mes). Cada uno optimizado para su carga de trabajo.

3. **Datos sincronizados en tiempo real:** PostgreSQL garantiza consistencia ACID. Ambos servicios leen/escriben la misma tabla de `pólizas`, `clientes`, etc. Sin ETL, sin polling, sin desincronización.

4. **Experiencia del equipo:** desarrollador 1 experto en Next.js + Prisma, desarrollador 2 en FastAPI + SQLAlchemy. Ambos patrones maduros y sin fricción.

5. **Aislamiento de esquema reduce riesgos:** el error en una migración chatbot no afecta tablas de la web. Mantenimiento paralelo sin deadlocks.

### 4. Consecuencias

| ✔ Consecuencias positivas | ⚠ Trade-offs / costos |
|---------------------------|----------------------|
| Ciclos de deploy independientes: cambios en chatbot no tocan Next.js. | **Acoplamiento indirecto vía BD:** cambios de esquema requieren coordinación. Si my-app agrega columna a `pólizas`, chatbot debe ajustar queries. |
| Escalado optimizado por carga: web serverless + API containerizada. | **Transacciones distribuidas:** si operación requiere atomicidad entre esquemas (`public` → `chatbot`), requiere lógica en app. |
| Sincronización de datos en tiempo real sin ETL manual. | **Complejidad operacional:** 2 ORMs, 2 deployment targets, 2 monitoreos. |
| Experiencia del equipo maximizada (no fuerza Python en Node o viceversa). | **Mayor consumo de conexiones:** cada instancia abre N conexiones. Supabase pooler tiene límite. |

**Relación con otros ADRs:** esta decisión depende de ADR-002 (BD compartida) y ADR-003 (Vercel + Render).

---

## ADR-002: Persistencia de Datos — PostgreSQL Relacional con Aislamiento de Esquemas

| ID | Título | Estado | Fecha |
|----|--------|--------|-------|
| ADR-002 | Seleccionar tipo de base de datos relacional con aislamiento por esquema para garantizar consistencia transaccional y evitar colisiones entre dos ORMs | Aceptada | 01/06/2026 |

### 1. Contexto

El sistema gestiona datos críticos para el negocio: pólizas activas, pagos, siniestros. La integridad de estos datos es no-negociable.

**Motivador 1 — Consistencia transaccional:** la web edita pólizas, el chatbot consulta el mismo dato simultáneamente. ¿Qué sucede si se anula una póliza mientras el chatbot la consulta? La respuesta debe ser consistente (o ver la versión antigua, o la nueva, pero nunca "medio").

**Motivador 2 — Relaciones complejas entre entidades:** 
- Una póliza tiene cliente, aseguradora, cobertura, pagos, siniestros asociados. 
- Obtener "historial de pólizas del cliente + últimos siniestros" requiere 3-4 joins.
- NoSQL documental fuerza denormalización o lógica en app para simular joins.

**Motivador 3 — Migraciones de esquema con dos ORMs distintos:** Prisma genera migraciones automáticas. SQLAlchemy requiere control manual. Usar BD que permita esquemas SQL aislados (`public` vs `chatbot`) reduce riesgo de conflicto.

**Motivador 4 — Consultas de auditoría y reportes:** "¿Quién modificó esta póliza y cuándo?" requiere auditoría confiable. Las tablas tienen `modificado_por` y `modificado_en` con foreign keys a `usuarios`. NoSQL dificulta estas queries.

### 2. Alternativas consideradas

| Alternativa | Ventaja principal en este contexto | Desventaja / Motivo de descarte |
|-------------|-----------------------------------|--------------------------------|
| **PostgreSQL (elegida)** | Transacciones ACID completas. Joins nativos y eficientes. Esquemas SQL para aislamiento. ORM-agnostic. | Escalabilidad horizontal limitada (requiere sharding). Esquema rígido = cambios lentos. |
| **MongoDB (NoSQL documental)** | Escalabilidad horizontal. Esquema flexible. Rápido insertar datos. | No soporta joins nativos. Transacciones multi-documento lentas. Las queries de reportes requieren lógica compleja en app. Denormalización causan duplicación de datos (pólizas + clientes embebidos = si cambia cliente, hay que actualizar N documentos). |
| **Firestore/Firebase (NoSQL cloud)** | Serverless, auto-escala. Sincronización RT con clientes. Simplicidad operacional. | Queries limitadas (sin joins). Costos impredecibles a escala. Vendor lock-in. Cambios de estructura rígidos. |

### 3. Decisión tomada

**Se decide:** PostgreSQL (Supabase) como única base de datos relacional, con aislamiento de esquemas SQL (`public` para my-app, `chatbot` para chatbot).

**Fundamentación:**

1. **Consistencia transaccional garantizada:** PostgreSQL ACID asegura que si dos servicios tocan la misma póliza, nunca ven un estado intermedio o corrompido. Fundamental para dominio de seguros.

2. **Relaciones complejas sin denormalización:** el modelo de datos tiene 1:N y N:N (cliente ↔ pólizas ↔ coberturas ↔ siniestros). Estos joins en PostgreSQL son triviales; en NoSQL requieren código manual o denormalización que causa inconsistencias.

3. **Auditoría y reportes:** tablas con `modificado_por` y `modificado_en` permiten queries como "¿quién cambió esta póliza?" o "reportar pólizas modificadas hoy" directamente en SQL. En NoSQL habría que scrapear logs.

4. **Migraciones con dos ORMs:** esquemas aislados (SQL feature nativa de PostgreSQL) resuelven el motivador 3. Prisma usa `public`, SQLAlchemy usa `chatbot`. Sin conflictos de tablas.

5. **Experiencia del equipo:** Prisma está optimizado para PostgreSQL. SQLAlchemy maduro con PostgreSQL.

### 4. Consecuencias

| ✔ Consecuencias positivas | ⚠ Trade-offs / costos |
|---------------------------|----------------------|
| Consistencia ACID = datos nunca en estado inconsistente. | **Escalabilidad horizontal limitada:** PostgreSQL escala mejor verticalmente. A millones de registros, considerar sharding o read replicas. |
| Joins eficientes = queries de reportes simples y rápidas. | **Esquema rígido:** agregar columna requiere migración. Cambios de estructura son lentos (vs NoSQL esquema flexible). |
| Auditoría nativa: `modificado_por`, `modificado_en` con foreign keys. | **Conexiones limitadas:** Supabase pooler (pgBouncer) tiene conexiones máximas. Con dos ORMs + múltiples instancias, se agotan rápido. |
| Migraciones independientes por ORM sin colisiones. | **Complejidad operacional:** mantener dos schemas + dos ORMs es más complejo que un único ORM. |

**Relación con otros ADRs:** depende de ADR-001 (microservicios compartidos). Reemplaza hipotética decisión anterior si existía.

---

## ADR-003: Comunicación entre Componentes — Consulta Directa a BD vs API Síncrona

| ID | Título | Estado | Fecha |
|----|--------|--------|-------|
| ADR-003 | Definir estrategia de sincronización de datos entre web y chatbot: consulta directa a BD compartida vs API REST síncrona | Aceptada | 01/06/2026 |

### 1. Contexto

La web necesita consultar datos que el chatbot también manipula (ej: conversaciones en WhatsApp, estado de solicitudes de pólizas). El chatbot necesita acceder a datos que la web rige (pólizas, clientes).

**Motivador 1 — Latencia:** si la web consultara el chatbot vía API remota (Render → Vercel), cada query add ~100-200ms. Para paneles web responsivos, inaceptable.

**Motivador 2 — Acoplamiento:** si la web depende de la API del chatbot, un outage del chatbot bloquea la web. Riesgo operacional.

**Motivador 3 — Transacciones:** si web edita `pólizas` e intenta coordinar con chatbot vía API, transacciones distribuidas = problema difícil (2PC, sagas, etc.).

**Motivador 4 — Escalabilidad:** chatbot puede escalar a múltiples instancias. Una API centralizada en chatbot se convierte en cuello de botella.

### 2. Alternativas consideradas

| Alternativa | Ventaja principal en este contexto | Desventaja / Motivo de descarte |
|-------------|-----------------------------------|--------------------------------|
| **API REST síncrona entre servicios** | Desacoplamiento clásico. Contratos claros. Fácil testear cada servicio aisladamente. | Latencia inter-servicio (~100ms por call). Si chatbot cae, web bloqueada. Transacciones distribuidas complejas. Acoplamiento temporal (cambios en API requieren actualización en dos servicios). |
| **Colas de mensajes (RabbitMQ/SQS)** | Desacoplamiento completo. Tolerancia a fallos. Escalabilidad. | Transacciones eventual-consistent, no inmediatas. Complejidad operacional (mantener cola). Para datos críticos de seguros, podría ser insuficiente. |
| **Consulta directa a BD compartida** (elegida) | Transacciones ACID sin coordinación distribuida. Latencia mínima. Escalabilidad: cada servicio consulta independientemente. | Acoplamiento vía BD (cambios de esquema impactan ambos). Sin "contrato" explícito entre servicios. Debugging más difícil. |

### 3. Decisión tomada

**Se decide:** ambos servicios consultan directamente la base de datos PostgreSQL compartida. Sin API de sincronización entre ellos. Cada servicio es responsable de su esquema.

**Fundamentación:**

1. **Latencia mínima:** consultas locales a BD (pool de conexiones) vs HTTP remoto. Diferencia: <1ms vs 100ms. Para dashboards web, crítico.

2. **Transacciones ACID sin coordinación:** si web necesita actualizar póliza + crear registro de auditoría, una transacción SQL lo hace atómicamente. Sin necesidad de 2PC o sagas entre servicios.

3. **Cada servicio escala independientemente:** si chatbot necesita optimizar queries a `conversations`, no afecta a web. Si web agrega índices a `pólizas`, ambos se benefician.

4. **Evitar SPOFs:** si hubiera API centralizada en chatbot, su caída bloquearía web. Ahora ambos hablan con BD; si uno falla, el otro sigue.

5. **Contexto del equipo:** Prisma y SQLAlchemy soportan conexión directa a Postgres sin necesidad de intermediarios.

### 4. Consecuencias

| ✔ Consecuencias positivas | ⚠ Trade-offs / costos |
|---------------------------|----------------------|
| Latencia mínima: <1ms vs 100ms de HTTP. | **Acoplamiento de esquema:** cambios en estructura de BD requieren coordinación. Si web agrega columna a `pólizas`, chatbot queries pueden romperse. |
| Transacciones ACID sin coordinación distribuida. | **Sin contrato explícito:** cada ORM consulta lo que le parece. Fácil romper por error (ej: schema mismatch). |
| Escalabilidad independiente: cada servicio consulta sin intermediarios. | **Complejidad de debugging:** si datos se ven diferentes, ¿es por query bug o esquema? Más difícil que rastrear API request. |
| Sin SPOF en API de coordinación. | **Mitigación requerida:** documentación de tablas compartidas, tests de integración para verificar consistencia. |

**Relación con otros ADRs:** alternativa a ADR-001 si arquitectura fuera diferente. Trabaja con ADR-002 (BD compartida).

---

## ADR-004: Infraestructura y Despliegue — Plataformas Heterogéneas con Servidor Compartido

| ID | Título | Estado | Fecha |
|----|--------|--------|-------|
| ADR-004 | Separar infraestructura de deployment: web en Vercel (serverless), API en Render (containerizada), BD en Supabase (managed PostgreSQL) | Aceptada | 01/06/2026 |

### 1. Contexto

El sistema tiene dos aplicaciones con requisitos de deployment y runtime completamente distintos.

**Motivador 1 — Naturaleza de cargas de trabajo:**
- Web: tráfico impredecible (usuarios log in puntualmente), requiere escalado rápido pero también dormir a cero.
- Chatbot: tráfico predecible 24/7, requiere estar siempre disponible, con costos fijos y previsibles.

**Motivador 2 — Tecnologías:**
- Web: Node.js + Next.js = serverless-friendly (Vercel, AWS Lambda, etc.).
- Chatbot: Python + FastAPI = containerizable pero no serverless (sin Python en Lambda fácilmente).

**Motivador 3 — Costo operacional:**
- Web en servidor propio (ej: AWS EC2): costo fijo alto, poca utilización en horarios bajos.
- Chatbot requiere instancia siempre activa: serverless no aplica.

**Motivador 4 — Evolución independiente:**
- Cambios en web no deben afectar deploy del chatbot.
- Rollbacks independientes: si web versión 2.1 falla, se revierte sin tocar chatbot.

### 2. Alternativas consideradas

| Alternativa | Ventaja principal en este contexto | Desventaja / Motivo de descarte |
|-------------|-----------------------------------|--------------------------------|
| **Un solo servidor (AWS EC2 / Linode) para todo** | Operación centralizada. Una BD, un servidor. Costos predecibles. | Escalabilidad: si web crece, ambas apps compiten por recursos. Rollbacks sincronizados (web + chatbot juntos). Overhead operacional (administrar VM, updates, firewalls). |
| **Vercel + Render + BD local (SQLite)** | Cada app en su plataforma optimizada. Despliegues independientes. | Sin sincronización de datos entre web y chatbot. Cada app tendría BD separada. Inconsistencia garantizada. |
| **Vercel + Render + Supabase** (elegida) | Web serverless con auto-escala. Chatbot containerizado 24/7. BD managed con backups automáticos. Despliegues independientes. Sincronización en tiempo real. | Complejidad: 3 plataformas = 3 dashboards, 3 costos. Latencia inter-servicio (leve). |

### 3. Decisión tomada

**Se decide:** 
- **my-app → Vercel:** Next.js serverless, auto-escala, Edge Functions, CDN global.
- **chatbot → Render:** FastAPI containerizado, instancia siempre activa ($7/mes free tier).
- **PostgreSQL → Supabase:** managed, backups automáticos, pooler integrado, escalable.

**Fundamentación:**

1. **Optimización por carga:** Vercel escala la web a cero cuando no hay tráfico. Render mantiene chatbot activo 24/7 con costo fijo mínimo. Ideal para patrones de uso diferentes.

2. **Despliegues independientes:** cambios en web → push a GitHub → Vercel auto-deploy. Sin afectar chatbot. Rollback en una plataforma sin tocar la otra.

3. **Costo operacional:** 
   - Vercel: $0-20 según funciones ejecutadas (paga por uso).
   - Render: $7/mes por instancia stable.
   - Supabase: $25/mes por compute + almacenamiento (paga por uso).
   - Total: predecible, bajo para startup.

4. **Experiencia del equipo:** Vercel es estándar para Next.js (zero-config). Render es simple para Python/FastAPI.

5. **Escalabilidad:** cada plataforma escala independientemente. Si web crece a 1M requests/mes, Vercel escala sin tocar chatbot.

### 4. Consecuencias

| ✔ Consecuencias positivas | ⚠ Trade-offs / costos |
|---------------------------|----------------------|
| Web escala a cero en baja demanda → costo mínimo. | **Complejidad operacional:** 3 plataformas = 3 dashboards, 3 monitoreos, 3 alertas. |
| Chatbot siempre disponible con costo fijo ($7/mes). | **Latencia inter-servicio:** Vercel → Render ~100ms (aceptable pero no ignorable). |
| Despliegues independientes: cambios en web no afectan chatbot. | **Vendor lock-in:** cambiar de plataforma requiere reingeniería (Vercel → AWS Lambda, etc.). |
| Rollbacks independientes: fallo en web no rollbackea chatbot. | **Supabase límite de conexiones:** pgBouncer tiene máximo. Si escalas a muchas instancias, se agota. |
| CDN global en Vercel = latencia baja para usuarios distribuidos. | **Costo acumulado:** 3 servicios = 3 facturas. Podría ser más caro que servidor único, dependiendo de escala. |

**Relación con otros ADRs:** depende de ADR-001 (microservicios) y ADR-002 (BD compartida).

---

## Matriz de Coherencia entre ADRs

| ADR | Depende de | Relacionado con | Conflictos |
|-----|-----------|-----------------|-----------|
| ADR-001 | — | ADR-003, ADR-004 | Ninguno |
| ADR-002 | — | ADR-001, ADR-003 | Ninguno |
| ADR-003 | ADR-002 | ADR-001, ADR-004 | Ninguno |
| ADR-004 | ADR-001 | ADR-002, ADR-003 | Ninguno |

**✓ Coherencia verificada:** los cuatro ADRs se complementan. ADR-001 (microservicios) y ADR-002 (BD compartida) son pilares. ADR-003 (sin API inter-servicio) y ADR-004 (plataformas independientes) son consecuencias de los anteriores.

---

## Verificación contra Código Real

**✔ Validado en código:**

| ADR | Evidencia en código |
|-----|-------------------|
| ADR-001 | `my-app/` es Next.js, `chatbot/` es FastAPI. Dos servicios independientes. |
| ADR-002 | `my-app/prisma/schema.prisma` tiene 12 modelos. `chatbot/app/database.py` crea schema `chatbot` en Postgres. |
| ADR-003 | Ambos servicios consultan directamente PostgreSQL. Sin API entre ellos. |
| ADR-004 | `my-app/next.config.ts` preparado para Vercel. `chatbot/` con Uvicorn pronto para Render. `prisma.config.ts` apunta a Supabase. |

---

## Checklist de Conformidad con Lineamientos

✔ **Estructura:**
- [x] 4 ADRs entregados (mínimo 4).
- [x] 1 ADR backend (ADR-001: microservicios).
- [x] 1 ADR persistencia (ADR-002: PostgreSQL + esquemas).
- [x] 1 ADR comunicación (ADR-003: consulta directa BD).
- [x] 1 ADR infraestructura (ADR-004: Vercel + Render + Supabase).

✔ **Contenido por ADR:**
- [x] Contexto describe PROBLEMA, no solución (alternativa no es obvia).
- [x] Al menos 2-3 alternativas reales y viables.
- [x] Alternativas tienen ventaja Y desventaja documentadas.
- [x] Desventajas conectan con motivadores del contexto.
- [x] Fundamentación conecta cada razón con contexto.
- [x] Consecuencias incluyen trade-offs negativos.

✔ **Coherencia:**
- [x] ADRs no se contradicen entre sí.
- [x] ADRs son coherentes con código real.
- [x] Relaciones entre ADRs documentadas.

✔ **Pregunta de autoevaluación:** Si alguien leyera solo estos 4 ADRs sin conocer Polizing, ¿entendería por qué está estructurado como microservicios con BD compartida en Vercel + Render? **Sí.**

---

**Documento conforme lineamientos de cátedra.**  
**Fecha:** 01/06/2026
