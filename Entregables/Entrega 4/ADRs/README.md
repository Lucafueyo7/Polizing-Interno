# Decisiones Arquitectónicas (ADRs) — Polizing-Interno

Entregable 4 · Práctica de Arquitectura y Diseño de Sistemas 2026
Grupo 6 — Felder, Ducos, Ferraro, Fueyo, Kravetz, Echavarría

## Índice

| ID | Decisión | Categoría | Estado |
|---|---|---|---|
| [ADR-001](ADR-001-arquitectura-backend-separacion-servicios.md) | División del backend en dos servicios desplegables independientes | Arquitectura del backend | Aceptada |
| [ADR-002](ADR-002-persistencia-postgresql-relacional.md) | Elección de base de datos principal para la capa de persistencia del panel | Persistencia de datos | Aceptada |
| [ADR-003](ADR-003-comunicacion-rest-sincrono-chatbot-mainapp.md) | Mecanismo de comunicación entre el chatbot y el panel | Comunicación entre componentes | Aceptada |
| [ADR-004](ADR-004-despliegue-vercel-y-contenedor-chatbot.md) | Estrategia de despliegue de los servicios del sistema | Infraestructura / Despliegue | Aceptada |
| [ADR-005](ADR-005-integracion-whatsapp-cloud-api.md) | Selección del proveedor de mensajería para el canal con clientes finales | Integración externa | Aceptada |

## Cómo se relacionan

ADR-001 establece la división en dos servicios (`my-app` y `chatbot`). De ahí salen las demás decisiones:

- ADR-002 elige PostgreSQL para `my-app`; el `chatbot` mantiene su propio store local consistente con la separación.
- ADR-003 define cómo se hablan los dos servicios (REST síncrono con `X-API-Key`).
- ADR-004 define dónde corre cada servicio (Vercel + PaaS de contenedores), consecuencia operativa de la división.
- ADR-005 fija el proveedor del canal con clientes, justificando la existencia del `chatbot` como servicio separado.

## Cómo exportar a PDF

Los ADRs viven en Markdown para versionarse junto al código. Para entregar un PDF consolidado (siguiendo el patrón de Entrega 3 con `modelo-datos.md` + `mod_datos.pdf`):

### Opción A — con `pandoc` (recomendada)

```bash
# Instalar pandoc en macOS:
brew install pandoc basictex

# Desde Entregables/Entrega 4/:
pandoc ADRs/README.md ADRs/ADR-001*.md ADRs/ADR-002*.md ADRs/ADR-003*.md ADRs/ADR-004*.md ADRs/ADR-005*.md \
  -o ADRs.pdf \
  --pdf-engine=xelatex \
  -V geometry:margin=2cm \
  -V mainfont="Helvetica" \
  --toc
```

### Opción B — sin instalar nada

Abrir cada `.md` en VSCode → extensión "Markdown PDF" (yzane.markdown-pdf) → click derecho → "Markdown PDF: Export (pdf)".

### Opción C — desde GitHub

Subir el directorio, abrir el README en GitHub, imprimir → "Guardar como PDF" desde el navegador.
