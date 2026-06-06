# -*- coding: utf-8 -*-
"""Genera el PDF de Diseño de APIs (Entregable 4) para Polizing.

Embebe el spec OpenAPI 3.0 desde polizing-api.openapi.yaml (single source of truth)
y lo envuelve en un documento que respeta la estructura del PDF de Lineamientos.
"""
import os
import re
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Preformatted, XPreformatted,
    Table, TableStyle, PageBreak, HRFlowable,
)

HERE = os.path.dirname(os.path.abspath(__file__))
ENTREGA = os.path.join(HERE, "..", "entrega final")
YAML_PATH = os.path.join(ENTREGA, "polizing-api.openapi.yaml")
PDF_PATH = os.path.join(ENTREGA, "Documentacion-APIs-Polizing-Entregable4.pdf")

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


# --- Bloques de código con $ref clicables (link interno hacia la Sección 2) ---
REF_RE = re.compile(r'(#/components/(?:schemas|responses)/(\w+))')
LINK_COLOR = "#2e6da4"


def code_block_linked(text, add_anchors=False):
    """Bloque de código preformateado donde cada $ref a #/components/... es un
    enlace interno. Si add_anchors=True, marca el destino en cada definición de
    componente (líneas 'Nombre:' con indentación de 4 espacios)."""
    text = sanitize(text)
    # Escapar markup XML (el YAML solo contiene '>', sin '<' ni '&').
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

    if add_anchors:
        lines = []
        for ln in text.split("\n"):
            m = re.match(r'^(    )(\w+):(\s*)$', ln)
            if m:
                ln = '<a name="ref_%s"/>%s' % (m.group(2), ln)
            lines.append(ln)
        text = "\n".join(lines)

    text = REF_RE.sub(
        lambda m: '<a href="#ref_%s" color="%s">%s</a>' % (m.group(2), LINK_COLOR, m.group(1)),
        text,
    )
    return XPreformatted(text, styles["MyCode"])


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

# Separar paths (Sección 1) de components (Sección 2)
comp_idx = next(i for i, ln in enumerate(yaml_lines) if ln.startswith("components:"))
# incluir el banner de comentario que precede a components en la sección 2
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
    "reutilizable, campos en camelCase y fechas en ISO 8601 UTC.",
    "Body"))
story.append(P("Se documentan 6 endpoints de integración.", "Note"))

# --- Sección 1
story.append(Spacer(1, 6))
story.append(P("1. Especificación OpenAPI 3.0 — Endpoints", "H1"))
story.append(P(
    "Spec completo de los 6 endpoints agrupados por módulo. Los componentes reutilizables "
    "(esquemas y respuestas de error) se detallan en la sección 2.", "Body"))
story.append(code_block_linked(paths_yaml))

# --- Sección 2
story.append(PageBreak())
story.append(P("2. Componentes reutilizables", "H1"))
story.append(P(
    "Esquema de seguridad, respuestas de error reutilizables y esquemas de entidad. "
    "El esquema <font face='Courier'>Error</font> se define una vez y se referencia con "
    "<font face='Courier'>$ref</font> en todos los endpoints; los esquemas de entidad "
    "(<font face='Courier'>Cliente</font>, <font face='Courier'>Poliza</font>, "
    "<font face='Courier'>MediaFile</font>) reflejan el modelo de datos de la Entrega 3.", "Body"))
story.append(code_block_linked(components_yaml, add_anchors=True))

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
