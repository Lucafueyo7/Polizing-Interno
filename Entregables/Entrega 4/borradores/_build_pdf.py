# -*- coding: utf-8 -*-
"""Genera el PDF de Diseño de APIs (Entregable 4) para Polizing.

Embebe el spec OpenAPI 3.0 desde polizing-api.openapi.yaml (single source of truth)
y lo envuelve en un documento que respeta la estructura del PDF de Lineamientos.
"""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Preformatted, Table, TableStyle,
    PageBreak, HRFlowable,
)

HERE = os.path.dirname(os.path.abspath(__file__))
YAML_PATH = os.path.join(HERE, "polizing-api.openapi.yaml")
PDF_PATH = os.path.join(HERE, "Documentacion-APIs-Polizing-Entregable4.pdf")

BRAND = colors.HexColor("#1f3a5f")
ACCENT = colors.HexColor("#2e6da4")
LIGHT = colors.HexColor("#eef3f8")
GREY = colors.HexColor("#666666")


def sanitize(text):
    """Reemplaza glyphs fuera de WinAnsi (p.ej. box-drawing) para Courier/Helvetica."""
    repl = {
        "─": "-", "│": "|", "┌": "+", "┐": "+",
        "└": "+", "┘": "+", "├": "+", "┤": "+",
        "█": "#",
    }
    for k, v in repl.items():
        text = text.replace(k, v)
    # cualquier remanente no representable -> '?'
    return text.encode("cp1252", "replace").decode("cp1252")


# ---------------------------------------------------------------- estilos
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    "DocTitle", parent=styles["Title"], fontName="Helvetica-Bold",
    fontSize=22, leading=26, textColor=BRAND, spaceAfter=4))
styles.add(ParagraphStyle(
    "DocSubtitle", parent=styles["Normal"], fontName="Helvetica",
    fontSize=12, leading=16, textColor=ACCENT, alignment=TA_CENTER, spaceAfter=2))
styles.add(ParagraphStyle(
    "DocMeta", parent=styles["Normal"], fontName="Helvetica",
    fontSize=10, leading=14, textColor=GREY, alignment=TA_CENTER))
styles.add(ParagraphStyle(
    "H1", parent=styles["Heading1"], fontName="Helvetica-Bold",
    fontSize=15, leading=18, textColor=BRAND, spaceBefore=16, spaceAfter=8))
styles.add(ParagraphStyle(
    "H2", parent=styles["Heading2"], fontName="Helvetica-Bold",
    fontSize=12, leading=15, textColor=ACCENT, spaceBefore=10, spaceAfter=5))
styles.add(ParagraphStyle(
    "Body", parent=styles["Normal"], fontName="Helvetica",
    fontSize=10, leading=14, alignment=TA_JUSTIFY, spaceAfter=6))
styles.add(ParagraphStyle(
    "MyBullet", parent=styles["Normal"], fontName="Helvetica",
    fontSize=10, leading=14, leftIndent=14, bulletIndent=4, spaceAfter=2))
styles.add(ParagraphStyle(
    "MyCode", parent=styles["Code"], fontName="Courier",
    fontSize=7.5, leading=9.3, textColor=colors.HexColor("#1a1a1a")))
styles.add(ParagraphStyle(
    "Cell", parent=styles["Normal"], fontName="Helvetica",
    fontSize=8.5, leading=11))
styles.add(ParagraphStyle(
    "CellH", parent=styles["Normal"], fontName="Helvetica-Bold",
    fontSize=8.5, leading=11, textColor=colors.white))
styles.add(ParagraphStyle(
    "Note", parent=styles["Normal"], fontName="Helvetica-Oblique",
    fontSize=9, leading=12, textColor=GREY, leftIndent=8,
    borderColor=ACCENT, borderWidth=0, spaceBefore=4, spaceAfter=8))


def P(t, s="Body"):
    return Paragraph(t, styles[s])


def bullet(t):
    return Paragraph(t, styles["MyBullet"], bulletText="•")


def table(rows, col_widths, header=True):
    data = []
    for i, row in enumerate(rows):
        st = "CellH" if (header and i == 0) else "Cell"
        data.append([Paragraph(sanitize(str(c)), styles[st]) for c in row])
    t = Table(data, colWidths=col_widths, repeatRows=1 if header else 0)
    style = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cdd7e2")),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]
    if header:
        style += [
            ("BACKGROUND", (0, 0), (-1, 0), BRAND),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT]),
        ]
    t.setStyle(TableStyle(style))
    return t


def code_block(text):
    return Preformatted(sanitize(text), styles["MyCode"])


# ---------------------------------------------------------------- footer
def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(GREY)
    canvas.drawString(2 * cm, 1.1 * cm,
                      "Entregable 4 - Practica de Arquitectura y Diseno de Sistemas 2026 | Polizing")
    canvas.drawRightString(A4[0] - 2 * cm, 1.1 * cm, "Pagina %d" % doc.page)
    canvas.setStrokeColor(colors.HexColor("#cdd7e2"))
    canvas.line(2 * cm, 1.5 * cm, A4[0] - 2 * cm, 1.5 * cm)
    canvas.restoreState()


# ---------------------------------------------------------------- contenido
with open(YAML_PATH, encoding="utf-8") as f:
    yaml_text = f.read()
yaml_lines = yaml_text.splitlines()

# Separar paths (Sección 3) de components (Sección 4)
comp_idx = next(i for i, ln in enumerate(yaml_lines) if ln.startswith("components:"))
# incluir el banner de comentario que precede a components en la sección 4
banner_idx = comp_idx
for i in range(comp_idx - 1, max(comp_idx - 4, -1), -1):
    if yaml_lines[i].startswith("#"):
        banner_idx = i
paths_yaml = "\n".join(yaml_lines[:banner_idx]).rstrip()
components_yaml = "\n".join(yaml_lines[banner_idx:]).rstrip()

story = []

# --- Portada / encabezado
story.append(Spacer(1, 1.2 * cm))
story.append(P("Arquitectura y Diseño de Sistemas 2026", "DocSubtitle"))
story.append(P("Diseño de APIs", "DocTitle"))
story.append(P("Documentación del contrato — Proyecto Polizing", "DocSubtitle"))
story.append(Spacer(1, 6))
story.append(P("Entregable 4 — Práctica de Arquitectura y Diseño de Sistemas 2026", "DocMeta"))
story.append(Spacer(1, 10))
story.append(HRFlowable(width="100%", thickness=1, color=ACCENT))
story.append(Spacer(1, 10))
story.append(P(
    "Este documento especifica el <b>diseño del contrato</b> de las APIs que el sistema "
    "Polizing expone al chatbot de atención a clientes. Se adopta el estándar "
    "<b>OpenAPI 3.0</b> y se respetan las convenciones de los lineamientos de la cátedra: "
    "URL base única, rutas en plural, verbos y status codes semánticos, un esquema de error "
    "reutilizable, campos en camelCase y fechas en ISO 8601 UTC. El objetivo es que el "
    "contrato se entienda sin ver el código: qué recibe, qué devuelve y cómo maneja los errores.",
    "Body"))
story.append(P(
    "Se documentan 6 endpoints de integración. Queda fuera de este entregable el endpoint "
    "<i>POST /policy-requests</i> (alta de solicitudes de póliza).", "Note"))

# --- Sección 1
story.append(P("1. Qué documenta este spec", "H1"))
story.append(P(
    "El spec cubre los endpoints que el chatbot necesita para identificar al cliente, "
    "consultar sus pólizas y operar sobre ellas. Cada endpoint se agrupa por módulo "
    "mediante <i>tags</i>:", "Body"))
story.append(table([
    ["#", "Módulo (tag)", "Operación", "Ruta"],
    ["1", "Clientes", "GET", "/clients/by-phone/{phone}"],
    ["2", "Pólizas", "GET", "/policies"],
    ["3", "Pólizas", "GET", "/policies/{policyId}"],
    ["4", "Documentos", "POST", "/circulation-card"],
    ["5", "Siniestros", "POST", "/claims"],
    ["6", "Pagos", "POST", "/payment-receipts"],
], [1.0 * cm, 3.2 * cm, 2.0 * cm, 7.3 * cm]))

# --- Sección 2
story.append(P("2. Convenciones aplicadas", "H1"))

story.append(P("URL base", "H2"))
story.append(P(
    "Se define una única URL base en <font face='Courier'>servers</font>. Todas las rutas "
    "son relativas a ella.", "Body"))
story.append(code_block("servers:\n  - url: https://api.polizing.com/v1"))
story.append(Spacer(1, 6))

story.append(P("Verbos y rutas", "H2"))
story.append(table([
    ["Verbo", "Uso en este spec", "Ejemplo"],
    ["GET", "Leer un recurso o una lista", "GET /policies, GET /policies/{policyId}"],
    ["POST", "Crear un recurso o ejecutar una acción", "POST /claims, POST /payment-receipts"],
], [2.0 * cm, 6.0 * cm, 5.5 * cm]))
story.append(Spacer(1, 4))
story.append(bullet("Rutas en plural y con sustantivos: <font face='Courier'>/clients</font>, <font face='Courier'>/policies</font>."))
story.append(bullet("Sin verbos en la ruta; la acción la expresa el método HTTP."))
story.append(bullet("Recursos anidados para relaciones: <font face='Courier'>/policies/{policyId}</font>."))
story.append(Spacer(1, 6))

story.append(P("Autenticación", "H2"))
story.append(P(
    "Todos los endpoints requieren autenticación mediante una API key de integración, "
    "documentada como <font face='Courier'>securityScheme</font> de tipo "
    "<font face='Courier'>apiKey</font> en el header <font face='Courier'>X-API-Key</font> "
    "y referenciada con <font face='Courier'>security: - apiKeyAuth: []</font>.", "Body"))

story.append(P("Status codes", "H2"))
story.append(table([
    ["Código", "Significado", "Cuándo se devuelve"],
    ["200", "OK", "GET exitoso, o acción de lectura (circulation-card)."],
    ["201", "Created", "POST exitoso que crea un recurso (claims, payment-receipts). Incluye header Location."],
    ["400", "Bad Request", "Cuerpo no es JSON válido o falta un query param obligatorio."],
    ["401", "Unauthorized", "API key ausente o inválida."],
    ["404", "Not Found", "Cliente, póliza o documento no encontrado."],
    ["413", "Payload Too Large", "El payload o un archivo supera el límite (8 MB/archivo, 25 MB total)."],
    ["422", "Unprocessable Entity", "Estructura válida pero falló una regla de validación (formato de campos)."],
    ["500", "Internal Server Error", "Error no controlado del servidor."],
    ["503", "Service Unavailable", "La integración no está configurada del lado del servidor."],
], [1.8 * cm, 3.6 * cm, 8.1 * cm]))
story.append(Spacer(1, 6))

story.append(P("Formato de errores", "H2"))
story.append(P(
    "Todos los errores devuelven el mismo formato, definido una sola vez en "
    "<font face='Courier'>components/schemas/Error</font> y referenciado con "
    "<font face='Courier'>$ref</font>. El campo <font face='Courier'>code</font> usa "
    "SNAKE_UPPER_CASE para identificar el error de negocio.", "Body"))
story.append(code_block(
    '{\n'
    '  "error": {\n'
    '    "code": "CLIENTE_NO_ENCONTRADO",\n'
    '    "message": "No existe un cliente activo con ese teléfono.",\n'
    '    "details": "Información adicional opcional"\n'
    '  }\n'
    '}'))
story.append(Spacer(1, 6))

story.append(P("Campos y fechas", "H2"))
story.append(bullet("Nombres de campos en camelCase: <font face='Courier'>fullName</font>, <font face='Courier'>policyNumber</font>, <font face='Courier'>contentBase64</font>."))
story.append(bullet("Fechas en ISO 8601 UTC con <font face='Courier'>format: date-time</font>: <font face='Courier'>2026-05-18T14:30:00Z</font>."))
story.append(bullet("Listas devueltas bajo la clave <font face='Courier'>data</font>: <font face='Courier'>{ data: [...] }</font>."))
story.append(bullet("Archivos adjuntos como objeto <font face='Courier'>MediaFile</font> con el contenido en base64."))

# --- Sección 3
story.append(PageBreak())
story.append(P("3. Especificación OpenAPI 3.0 — Endpoints", "H1"))
story.append(P(
    "Spec completo de los 6 endpoints agrupados por módulo. Los componentes reutilizables "
    "(esquemas y respuestas de error) se detallan en la sección 4.", "Body"))
story.append(code_block(paths_yaml))

# --- Sección 4
story.append(PageBreak())
story.append(P("4. Componentes reutilizables", "H1"))
story.append(P(
    "Esquema de seguridad, respuestas de error reutilizables y esquemas de entidad. "
    "El esquema <font face='Courier'>Error</font> se define una vez y se referencia con "
    "<font face='Courier'>$ref</font> en todos los endpoints; los esquemas de entidad "
    "(<font face='Courier'>Cliente</font>, <font face='Courier'>Poliza</font>, "
    "<font face='Courier'>MediaFile</font>) reflejan el modelo de datos de la Entrega 3.", "Body"))
story.append(code_block(components_yaml))

# --- Sección 5
story.append(PageBreak())
story.append(P("5. Checklist de entrega", "H1"))
story.append(P(
    "Verificación del cumplimiento de los lineamientos de la cátedra.", "Body"))
story.append(table([
    ["Ítem del checklist", "Cómo lo cumple este spec"],
    ["Archivo .yaml en el repositorio", "polizing-api.openapi.yaml junto a este PDF."],
    ["Valida sin errores en editor.swagger.io", "OpenAPI 3.0.3; parsea sin errores y todos los $ref resuelven."],
    ["URL base definida en servers", "https://api.polizing.com/v1."],
    ["Endpoints agrupados por módulo con tags", "Clientes, Pólizas, Documentos, Siniestros, Pagos."],
    ["Cada endpoint tiene summary de negocio", "Todos incluyen summary y description."],
    ["Indica si requiere autenticación", "security: apiKeyAuth en todos los endpoints (header X-API-Key)."],
    ["Path y query params documentados", "phone, policyId documentados con tipo, formato y ejemplo."],
    ["requestBody con tipos y required", "Cada POST lista properties, tipos y campos required."],
    ["Response exitosa con schema correcto", "200/201 referencian Cliente, Poliza, CirculationCard o Confirmation."],
    ["Errores esperables documentados", "401, 404, 413, 422, 500, 503 según corresponda."],
    ["Status codes semánticamente correctos", "200 lectura, 201 creación con Location, 4xx/5xx por caso."],
    ["Errores con $ref a Error reutilizable", "Todas las respuestas de error usan $ref a #/components/schemas/Error."],
    ["Campos coherentes con el modelo de datos", "Cliente y Poliza derivan de las entidades de la Entrega 3."],
    ["Nombres de campos en camelCase", "fullName, policyNumber, contentBase64, occurredAt, etc."],
    ["Fechas en format: date-time (ISO 8601)", "occurredAt usa format: date-time UTC."],
    ["code de error en SNAKE_UPPER_CASE", "Ej.: CLIENTE_NO_ENCONTRADO."],
], [6.3 * cm, 7.2 * cm]))
story.append(Spacer(1, 10))
story.append(P(
    "<b>Autoevaluación:</b> un integrante del equipo podría implementar un cliente de esta "
    "API usando únicamente este documento — cada endpoint declara su entrada, su salida y "
    "sus errores.", "Note"))

# ---------------------------------------------------------------- build
doc = SimpleDocTemplate(
    PDF_PATH, pagesize=A4,
    leftMargin=2 * cm, rightMargin=2 * cm,
    topMargin=2 * cm, bottomMargin=2 * cm,
    title="Diseño de APIs - Polizing - Entregable 4",
    author="Equipo Polizing",
)
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print("PDF generado:", PDF_PATH)
