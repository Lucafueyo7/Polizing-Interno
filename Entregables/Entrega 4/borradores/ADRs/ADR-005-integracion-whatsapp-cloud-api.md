# ADR-005 — Selección del proveedor de mensajería para el canal con clientes finales

| ID | Título | Estado | Fecha |
|---|---|---|---|
| ADR-005 | Selección del proveedor de mensajería para el canal con clientes finales | Aceptada | 27/05/2026 |

## 1. Contexto

El chatbot definido en ADR-001 atiende a clientes finales a través de un canal de mensajería. La interacción incluye texto bidireccional, recepción de imágenes y PDFs (comprobantes de pago, fotos de siniestros, actas policiales) y envío de documentos (tarjeta de circulación en PDF). Para producir esos flujos se necesita elegir un proveedor concreto que conecte el servicio con la red de mensajería que ya usan los clientes.

Motivadores que obligan a tomar una decisión:

- **Motivador 1 — El canal lo define el usuario:** los clientes finales de productores de seguros en Argentina ya tienen WhatsApp instalado y lo usan a diario. Pedirles que instalen una app nueva o usen un canal alternativo (SMS, email) baja drásticamente la adopción. La elección de canal no es libre: es WhatsApp.
- **Motivador 2 — Necesidades técnicas concretas:** se necesitan templates aprobados para mensajes iniciados por el negocio (notificaciones de vencimiento), webhooks confiables para entrada (cada mensaje del cliente llega al bot) y APIs de envío programático con soporte de medios (imágenes, PDFs).
- **Motivador 3 — Costo (PoC académico):** el sistema debe poder operar en un tier gratuito o muy barato durante el desarrollo y la presentación del trabajo. No hay presupuesto para licenciamiento enterprise ni para fees per-message altos.
- **Motivador 4 — Manejo de fallos y rate limits (RNF Interoperabilidad, Entrega 1):** el sistema debe estar preparado para que el proveedor aplique throttling, rechace mensajes o tenga ventanas de mantenimiento, sin que esto rompa la conversación con el cliente.

## 2. Alternativas consideradas

| Alternativa | Ventaja principal en este contexto | Desventaja / Motivo de descarte |
|---|---|---|
| Twilio WhatsApp API (agregador) | SDK maduro, documentación excelente, soporte 24/7, sandbox de pruebas inmediato. Abstrae a Meta. | **Costo por mensaje elevado** (markup sobre la tarifa de Meta), contradice motivador 3. La capa de abstracción agrega latencia y oculta features que Meta libera primero en su API directa. |
| 360dialog (BSP — Business Solution Provider) | Acceso oficial WhatsApp Business API con soporte comercial; precio más competitivo que Twilio. | Requiere onboarding comercial (verificación de empresa) y un mínimo de fee mensual no compatible con un PoC académico (motivador 3). Sin sandbox abierto inmediato. |
| Meta WhatsApp Cloud API (directa, elegida) | Acceso oficial directo al canal, **tier de mensajes de servicio gratuito muy generoso**, números de prueba inmediatos, control total sobre templates y números. | — (esta fue la elegida) |

## 3. Decisión tomada

**Se decide:** integrar el chatbot directamente con **Meta WhatsApp Cloud API**, encapsulando la llamada en `chatbot/app/whatsapp.py` (cliente HTTPS para envío) y exponiendo el webhook de entrada en `chatbot/app/api.py` (`GET/POST /webhooks/whatsapp`). Los templates iniciados por negocio se registran y aprueban directamente en el WhatsApp Business Manager de Meta.

**Fundamentación:**

1. **Resuelve los motivadores 1 y 3 (canal correcto y costo):** Meta es la fuente oficial; ir directo evita el markup de los agregadores. El tier gratuito de Cloud API alcanza para el volumen del PoC y para la demo de la cátedra sin requerir tarjeta de crédito.
2. **Resuelve el motivador 2 (necesidades técnicas):** Cloud API provee templates, webhooks de entrada y endpoints de envío de medios (imágenes y PDFs) usados en los flujos de comprobante y de tarjeta de circulación. Estas features están disponibles desde el día uno, sin esperar a que un agregador las exponga.
3. **Aislamiento del proveedor:** el cliente HTTP vive solo en `chatbot/app/whatsapp.py`. Si en el futuro hubiera que migrar a un BSP (por necesidad de soporte enterprise o por SLA), el cambio queda contenido en ese módulo. La decisión es reversible al costo de reescribir un archivo.

## 4. Consecuencias

| Consecuencias positivas | Trade-offs / costos |
|---|---|
| Costo cero/marginal durante PoC y demo. | **Gestión propia de templates y aprobaciones:** cada mensaje iniciado por el negocio requiere registrar un template y esperar la aprobación de Meta (puede tardar horas o ser rechazado). |
| Acceso a features nuevas en cuanto Meta las publica, sin esperar a un intermediario. | **Sin SLA premium:** ante incidentes de Meta no hay soporte humano dedicado, solo status page y documentación pública. Hay que tolerar ventanas ocasionales (motivador 4). |
| El cliente HTTP encapsulado en `chatbot/app/whatsapp.py` mantiene el resto del bot agnóstico al proveedor. | **Rate limits sin smoothing automático:** el bot debe respetar los límites de Meta por número (mensajes/segundo, calidad del número). En el PoC el riesgo es bajo, pero en producción real exigiría una capa de rate limiting/cola interna. |
| Verificación de webhook estándar (HMAC contra `APP_SECRET`), encaja con el patrón de seguridad de ADR-003. | **Acoplamiento al proveedor sigue existiendo:** los formatos de webhook y de payload son específicos de Meta; migrar implica reescribir el handler de entrada, no solo el cliente de salida. |

**Decisiones relacionadas:**
- ADR-001 (separación de servicios): el chatbot existe como servicio separado, en gran parte por la necesidad de hostear este webhook estable.
- ADR-003 (REST con API Key): el patrón request/response sincrónico del bot encaja con el flujo entrante de WhatsApp.
- ADR-004 (despliegue): el PaaS de contenedores provee la URL pública estable que Meta requiere como webhook.
