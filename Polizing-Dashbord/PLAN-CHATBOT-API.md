# Plan: Exponer APIs en my-app para el chatbot de Polizing

## Contexto

Hoy el chatbot (`C:\Polizing-Interno\chatbot`, Python/FastAPI) funciona en modo `mock`: tiene su propia SQLite (`MockClient`, `MockPolicy`, `MockOperation`) que duplica entidades del negocio. Todo lo que un usuario hace por WhatsApp (siniestros, comprobantes de pago, pedidos de tarjeta de circulación) se queda dentro del chatbot, desconectado de my-app.

El objetivo es **enchufar el chatbot a my-app**: my-app pasa a ser el **único dueño de los datos de negocio**, y el chatbot se queda solo con lo suyo (mensajes recibidos/enviados y estado conversacional).

El chatbot ya está preparado para esto: su cliente HTTP (`chatbot/app/main_system_client.py:11-57`) tiene los paths y el shape de payloads cableados — solo necesita que `MAIN_SYSTEM_BASE_URL` apunte a un servidor real. **No vamos a tocar código del chatbot, sólo su `.env`**.

## Principio rector: my-app es el único dueño de los datos de negocio

- **Chatbot** = canal de entrada de WhatsApp. Sus únicas tablas con sentido propio son `editable_messages`, `conversations`, `received_messages`, `outbound_messages`. Las tablas `mock_clients` / `mock_policies` / `mock_operations` y el módulo `mock_system.py` quedan **inertes** (la condición `use_mock` en `main_system_client.py:25-26` los esquiva cuando `MAIN_SYSTEM_BASE_URL != "mock"`); pueden eliminarse después en limpieza, no afecta nada.
- **my-app** = fuente de verdad. Postgres + Prisma. Toda consulta (cliente por teléfono, pólizas, tarjeta de circulación) y toda escritura (registrar siniestro, registrar pago) ocurren acá.
- **Flujo**: usuario WhatsApp → chatbot recopila → HTTP a my-app → my-app consulta/escribe Postgres → my-app responde JSON → chatbot le contesta al usuario.

## Autenticación de clientes WhatsApp (vía my-app)

No hay PIN/OTP en el chatbot. La autenticación es **implícita por número de teléfono**: si el teléfono del que llega el WhatsApp corresponde a un cliente activo en la BD de my-app, queda "autenticado"; si no, el chatbot le responde "client_not_found" y corta (ver `conversation.py:36-39`). Esto ya está implementado del lado del chatbot — lo que cambia es **quién resuelve la pregunta**:

- **Antes**: lo resolvía `mock_system.get_client_by_phone` contra la SQLite del chatbot.
- **Ahora**: lo resuelve **my-app** vía `GET /api/chatbot/clients/by-phone/[phone]`.
  - 200 + `{ id, phone, full_name, active: true }` → cliente autenticado, puede operar.
  - 404 → cliente no autorizado, chatbot lo rechaza.
  - 401 (sin/mal API key) → falla la integración, el chatbot no opera.

Es decir: **my-app es la autoridad de autenticación de clientes WhatsApp**. El chatbot solo enruta. No hay ningún concepto de cliente "registrado" dentro del chatbot.

## Decisiones acordadas

- **Storage de archivos**: en la BD (columnas `Bytes` en Postgres → `bytea`). Tanto los archivos que el cliente sube por chatbot (licencias, cédula, denuncia, fotos, comprobantes) como la tarjeta de circulación que en el futuro vendrá de APIs externas de aseguradoras.
- **Patente / dominio**: agregar `polizas.dominio String?` al schema Prisma (el chatbot ya lo espera).
- **Auth de integración** (chatbot ↔ my-app): header `X-API-Key` validado contra `CHATBOT_API_KEY` (env var).
- **Seed**: lo administra el usuario (no toco `prisma/seed-data.ts`).

## Arquitectura

Cada funcionalidad del chatbot ↔ un route handler en App Router de my-app. Prefijo `/api/chatbot/*`. Los paths internos calzan con lo que ya espera el cliente HTTP del chatbot:

| Funcionalidad chatbot | Route handler en my-app | Método | Rol |
|---|---|---|---|
| Autenticar cliente por teléfono | `app/api/chatbot/clients/by-phone/[phone]/route.ts` | GET | Identidad |
| Listar pólizas del cliente | `app/api/chatbot/policies/route.ts` | GET | Consulta |
| Detalle/validación de póliza | `app/api/chatbot/policies/[policyId]/route.ts` | GET | Consulta + ownership |
| Tarjeta de circulación | `app/api/chatbot/circulation-card/route.ts` | POST | Consulta |
| Registrar comprobante de pago | `app/api/chatbot/payment-receipts/route.ts` | POST | Escritura |
| Registrar siniestro | `app/api/chatbot/claims/route.ts` | POST | Escritura |

## Cambios al schema (Prisma)

Archivo: `C:\Polizing-Interno\my-app\prisma\schema.prisma`

1. **`polizas`** — agregar `dominio String?` (patente del vehículo).
2. **`siniestro_documentos`** — agregar `contenido Bytes?` (binario del archivo). El campo `url` existente queda como fallback.
3. **`pagos`** — agregar `comprobante_contenido Bytes?` y `comprobante_mime String?` (para guardar el archivo que sube el cliente). `comprobante String?` actual se usa como nombre/referencia.
4. **`polizas`** — agregar `tarjeta_circulacion_pdf Bytes?` y `tarjeta_circulacion_mime String?` (el `tarjeta_circulacion_poliza String?` actual queda como identificador del documento).

Comando: `npx prisma migrate dev --name chatbot_api_fields`.

## Shape exacto de cada respuesta (debe matchear lo que espera el chatbot)

El chatbot consume estos JSON tal cual; cualquier desalineación rompe los flujos. Referencias: `chatbot/app/mock_system.py:10-72`, `chatbot/app/intents/utils.py:format_policies`.

### Cliente
```json
{ "id": 123, "phone": "5491112345678", "full_name": "Juan Pérez", "active": true }
```
- `full_name`: para personas se compone `nombre + " " + apellido` de `clientes_no_corporativos`; para corporativos `razon_social` de `clientes_corporativos`.
- `active`: derivar de `clientes.estado === "activo"`.

### Póliza (objeto `items[*]` en list y respuesta directa en get por id)
```json
{
  "id": 7,
  "policy_number": "AUTO-1001",
  "insurance_type": "Automotor",
  "category": "auto",
  "coverage": "todo_riesgo",
  "domain": "AB123CD",
  "description": "Renault Sandero 2020"
}
```
- `insurance_type`: `tipos_seguro.nombre`.
- `category`: por ahora derivado del propio `tipos_seguro.nombre` normalizado a slug lower-case (ej. "Automotor" → "auto"). Si más adelante hace falta una taxonomía formal, agregar `tipos_seguro.categoria` en otra iteración.
- `coverage`: `polizas.cobertura` (enum `CoberturaTipo`) como string.
- `domain`: el nuevo `polizas.dominio`.
- `description`: campo libre — por ahora `cobertura + " - " + aseguradora.razon_social` o simplemente `aseguradora.razon_social` (no hay un campo nativo perfecto; mantener simple).

### Tarjeta de circulación
```json
{ "filename": "tarjeta-AUTO-1001.pdf", "mime_type": "application/pdf", "content_base64": "JVBERi0..." }
```

### Registrar pago / siniestro
```json
{ "reference": "PAY-1A2B3C4D" | "SIN-5E6F...", "status": "ok" }
```

## Helpers nuevos compartidos

- **`C:\Polizing-Interno\my-app\lib\chatbot\auth.ts`**
  - `requireChatbotApiKey(req: Request): Response | null` — chequea `X-API-Key` contra `process.env.CHATBOT_API_KEY` y devuelve `401` si no matchea, o `null` si OK.

- **`C:\Polizing-Interno\my-app\lib\chatbot\responses.ts`**
  - `jsonOk(data)`, `jsonError(message, status)`, `notFound()` — wrappers consistentes.

- **`C:\Polizing-Interno\my-app\lib\chatbot\schemas.ts`**
  - Zod schemas de los payloads que envía el chatbot (CirculationCardSchema, PaymentReceiptSchema, ClaimSchema). Shape exacto en `chatbot/app/intents/claim.py:_build_payload` y `payment_receipt.py:on_file`.

- **`C:\Polizing-Interno\my-app\lib\chatbot\client-by-phone.ts`**
  - `findClienteByTelefono(phone: string)` — query Prisma con joins a `clientes_corporativos` y `clientes_no_corporativos`, devuelve cliente normalizado o `null`. Reutilizado por todos los endpoints que necesitan resolver/autenticar al cliente.

- **`C:\Polizing-Interno\my-app\lib\chatbot\policy-mapper.ts`**
  - `mapPolicyToChatbotShape(poliza)` — produce el JSON exacto que espera el chatbot (con `category` derivado de `tipos_seguro.nombre`).

## Detalle de cada route handler

### 1. `GET /api/chatbot/clients/by-phone/[phone]` — Autenticación
Archivo: `app/api/chatbot/clients/by-phone/[phone]/route.ts`
- Valida API key.
- `findClienteByTelefono(phone)` filtrando por `estado: 'activo'`.
- 404 si no existe o inactivo (el chatbot lo interpreta como "no autenticado" vía `_get_optional`).
- Respuesta: `{ id, phone, full_name, active: true }`.

### 2. `GET /api/chatbot/policies?phone={phone}`
Archivo: `app/api/chatbot/policies/route.ts`
- Valida API key, lee `phone` del query string.
- Resuelve cliente; si no existe → `{ items: [] }`.
- `prisma.polizas.findMany({ where: { cliente_id, estado: 'vigente' }, include: { tipo_seguro: true, aseguradora: true } })`.
- Mapear cada póliza con `mapPolicyToChatbotShape`.
- Respuesta: `{ items: [...] }`.

### 3. `GET /api/chatbot/policies/[policyId]?phone={phone}`
Archivo: `app/api/chatbot/policies/[policyId]/route.ts`
- Igual al anterior pero filtra por `id` Y `cliente_id` (ownership).
- 404 si no matchea — es lo que el chatbot usa para validar antes de empezar siniestro/pago.

### 4. `POST /api/chatbot/circulation-card`
Archivo: `app/api/chatbot/circulation-card/route.ts`
- Body: `{ phone, policy_id }`.
- Resuelve cliente + póliza con ownership.
- Lee `polizas.tarjeta_circulacion_pdf` (Bytes). Si está vacío → 404.
- Respuesta: `{ filename, mime_type, content_base64 }`. `filename` puede ser `tarjeta-${numero_poliza}.pdf`.

### 5. `POST /api/chatbot/payment-receipts`
Archivo: `app/api/chatbot/payment-receipts/route.ts`
- Body que envía el chatbot:
  ```json
  { "phone": "...", "policy": { ...policy object... }, "file": { "filename", "mime_type", "content_base64" } }
  ```
- Resuelve cliente + póliza con ownership.
- Decodifica `content_base64` → Bytes.
- Crea registro en `pagos`: `cliente_id`, `estado: 'pendiente'`, `comprobante: file.filename`, `comprobante_contenido: bytes`, `comprobante_mime: file.mime_type`. Vincula la póliza (setear `polizas.pago_id`).
- `updateTag(CACHE_TAGS.pagos)`.
- Respuesta: `{ reference: String(pagoId), status: "ok" }`.

### 6. `POST /api/chatbot/claims`
Archivo: `app/api/chatbot/claims/route.ts`
- Body:
  ```json
  {
    "phone": "...",
    "policy": { ...policy object... },
    "date": "DD/MM/AAAA",
    "time": "HH:MM",
    "place": "...",
    "description": "...",
    "third_parties": "NO" | "<texto>",
    "police_report": null | { filename, mime_type, content_base64 },
    "driver_license": { filename, mime_type, content_base64 },
    "vehicle_card":   { filename, mime_type, content_base64 },
    "additional_files": [ { filename, mime_type, content_base64 }, ... ]
  }
  ```
- Resuelve cliente + póliza con ownership.
- Parsea `date + time` (AR) → `fecha_ocurrencia` ISO.
- Genera `numero` único: `SIN-${Date.now().toString(36).toUpperCase()}-${randomHex(4)}`.
- Transacción Prisma:
  - Crea `siniestros` con `estado: 'nuevo'`, `leido: false`, `titulo: "Siniestro reportado por chatbot — " + policy.numero_poliza`, `descripcion_hechos` compuesto de `description`, `place`, `third_parties` y mención a póliza.
  - Por cada archivo presente (`driver_license`, `vehicle_card`, `police_report` si no es null, cada `additional_files[i]`): un `siniestro_documentos` con `nombre = filename`, `mime_type`, `tipo = mime.startsWith("image/") ? 'img' : 'pdf'`, `contenido = bytes`, `tamano_bytes`.
- `updateTag(CACHE_TAGS.siniestros)`.
- Respuesta: `{ reference: siniestro.numero, status: "ok" }`.

## Configuración

### my-app
- Agregar a `.env` y `.env.example`: `CHATBOT_API_KEY=<token-aleatorio>`.

### chatbot
- Editar `C:\Polizing-Interno\chatbot\.env`:
  ```
  MAIN_SYSTEM_BASE_URL=http://localhost:3000/api/chatbot
  MAIN_SYSTEM_API_KEY=<mismo-token-que-arriba>
  ```
- **No se toca código del chatbot.** Cambiar la URL base hace que `use_mock` (línea 25 de `main_system_client.py`) deje de ser true y empiece a hablar HTTP con my-app automáticamente.

## Archivos a crear

```
my-app/
├── app/api/chatbot/
│   ├── clients/by-phone/[phone]/route.ts
│   ├── policies/route.ts
│   ├── policies/[policyId]/route.ts
│   ├── circulation-card/route.ts
│   ├── payment-receipts/route.ts
│   └── claims/route.ts
├── lib/chatbot/
│   ├── auth.ts
│   ├── responses.ts
│   ├── schemas.ts
│   ├── client-by-phone.ts
│   └── policy-mapper.ts
└── prisma/migrations/<timestamp>_chatbot_api_fields/ (generado por prisma migrate)
```

## Archivos a modificar

- `C:\Polizing-Interno\my-app\prisma\schema.prisma` (campos nuevos en `polizas`, `pagos`, `siniestro_documentos`)
- `C:\Polizing-Interno\my-app\.env` y `.env.example` (`CHATBOT_API_KEY`)
- `C:\Polizing-Interno\chatbot\.env` (cambiar `MAIN_SYSTEM_BASE_URL` y `MAIN_SYSTEM_API_KEY`)

## Verificación end-to-end

1. **Migrar BD**: `npx prisma migrate dev --name chatbot_api_fields` en my-app.
2. **Cargar datos mínimos** (el usuario administra): un `clientes` con `telefono='5491112345678'` y estado `activo`, su `clientes_no_corporativos`, una `empresas_aseguradoras`, un `tipos_seguro` con `nombre='Automotor'`, dos `polizas` con `dominio` cargado (estado `vigente`) y al menos una con `tarjeta_circulacion_pdf` y `tarjeta_circulacion_mime` cargados.
3. **Arrancar my-app**: `npm run dev` (puerto 3000).
4. **Smoke tests con curl** antes de prender el chatbot:
   - `curl -H "X-API-Key: $KEY" http://localhost:3000/api/chatbot/clients/by-phone/5491112345678` → 200 con `{id, phone, full_name, active:true}`. **Esto es la autenticación.**
   - `curl http://localhost:3000/api/chatbot/clients/by-phone/5491112345678` (sin header) → 401.
   - `curl -H "X-API-Key: $KEY" http://localhost:3000/api/chatbot/clients/by-phone/0000` → 404.
   - `curl -H "X-API-Key: $KEY" "http://localhost:3000/api/chatbot/policies?phone=5491112345678"` → `{ items: [...] }` con `category` y `coverage` poblados.
5. **Arrancar el chatbot** (`uvicorn app.main:app --reload`) con el `.env` actualizado.
6. **Flujo completo** desde el panel admin del chatbot o webhook simulado:
   - Mensaje desde teléfono **no registrado** → chatbot responde "client_not_found" (la auth la rechazó my-app vía 404).
   - Mensaje desde teléfono registrado → menú → opción 3 (siniestro), completar todos los pasos. Verificar en my-app: `/siniestros` lista el nuevo siniestro, `/siniestros/[id]` muestra los documentos.
   - Opción 2 (pago) → aparece en `/pagos`.
   - Opción 1 (tarjeta circulación) → chatbot devuelve el PDF que estaba cargado en my-app.
7. **Aislamiento de BD**: confirmar que la SQLite del chatbot (`chatbot/data/chatbot.db`) NO recibe inserciones en `mock_operations` ni `mock_clients` durante los flujos — sólo `conversations`, `received_messages`, `outbound_messages`. Toda la información de negocio queda únicamente en Postgres de my-app.
