# WhatsApp Insurance Chatbot

MVP de chatbot de WhatsApp para un productor de seguros. Usa FastAPI, SQLite, Meta WhatsApp Cloud API y un mock REST del sistema principal.

## Funcionalidades

- Webhook de WhatsApp Cloud API.
- Motor conversacional deterministico por numero de telefono.
- Solicitud de poliza auto/moto.
- Solicitud de tarjeta de circulacion.
- Adjuntar comprobantes de pago en imagen o PDF.
- Registro de siniestros con carnet, cedula verde, denuncia y adjuntos.
- Mock REST del sistema principal.
- Panel admin simple para editar textos, menus y respuestas.
- Endpoint interno para mensajes salientes normales y templates.

## Instalacion Local

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

La app queda disponible en `http://127.0.0.1:8000`.

## Admin

Panel: `http://127.0.0.1:8000/admin`

Credenciales por defecto en `.env.example`:

```text
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

Cambiar estas credenciales antes de probar con datos reales.

## Datos Mock

Al iniciar se crea un cliente demo:

```text
Telefono: 5491112345678
Polizas: AUTO-1001, MOTO-2001
```

Para probar desde WhatsApp, el numero emisor debe existir en `mock_clients`. Para pruebas rapidas se puede modificar el seed en `app/seed.py` o editar la base SQLite.

## WhatsApp Cloud API

Configurar en `.env`:

```text
WHATSAPP_VERIFY_TOKEN=un-token-propio
WHATSAPP_ACCESS_TOKEN=token-de-meta
WHATSAPP_PHONE_NUMBER_ID=id-del-numero
```

Exponer localmente con ngrok:

```bash
ngrok http 8000
```

Configurar en Meta:

```text
Callback URL: https://TU-DOMINIO-NGROK/webhooks/whatsapp
Verify token: el valor de WHATSAPP_VERIFY_TOKEN
```

Suscribir el webhook al evento `messages`.

## Endpoints Principales

```http
GET /health
GET /webhooks/whatsapp
POST /webhooks/whatsapp
POST /api/outbound/messages
POST /api/outbound/templates
GET /admin
```

Los endpoints salientes requieren header:

```text
X-API-Key: valor-de-OUTBOUND_API_KEY
```

Ejemplo:

```bash
curl -X POST http://127.0.0.1:8000/api/outbound/messages \
  -H 'Content-Type: application/json' \
  -H 'X-API-Key: change-me' \
  -d '{"phone":"5491112345678","message":"Mensaje de prueba"}'
```

## Mock Del Sistema Principal

```http
GET /mock/clients/by-phone/{phone}
GET /mock/policies?phone={phone}
POST /mock/policy-requests
POST /mock/circulation-card
POST /mock/payment-receipts
POST /mock/claims
```

Cuando exista el sistema real, cambiar:

```text
MAIN_SYSTEM_BASE_URL=https://api-sistema-principal.example.com
MAIN_SYSTEM_API_KEY=...
```

## Notas Operativas

- Dentro de la ventana de 24 horas se envian mensajes normales.
- Para mensajes proactivos fuera de la ventana de 24 horas se debe usar `/api/outbound/templates` con templates aprobados por Meta.
- WhatsApp define limites propios de tamano para adjuntos. El backend acepta imagen/PDF, pero Meta puede rechazar archivos grandes.
- Si `WHATSAPP_ACCESS_TOKEN=change-me`, los envios quedan mockeados en la tabla `outbound_messages`.
