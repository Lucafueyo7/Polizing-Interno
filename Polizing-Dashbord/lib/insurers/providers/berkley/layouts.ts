/**
 * Layouts de ancho fijo de los archivos GD de Berkley que parseamos en la
 * iteración 1 (detección de altas/cambios + cartera local). Posiciones base 1,
 * tomadas del manual Berkley §4.3. Fechas en AAAAMMDD salvo donde se aclare.
 *
 * Solo se incluyen los campos que usamos; el resto de columnas se ignora.
 */

import type { FixedLayout } from "../../fixed-width";

/**
 * §4.3.11 asegur — Asegurados (clientes).
 * Usar nombre/teléfono "nuevos" (largos, pos 243/213).
 * tipo_persona: 'F' = persona física / 'J' = jurídica (corporativo).
 */
export const ASEGUR_LAYOUT: FixedLayout = [
  { name: "codigo_asegurado", desde: 1,   longitud: 8  },
  { name: "calle",            desde: 34,  longitud: 24 },
  { name: "codigo_postal",    desde: 58,  longitud: 4  },
  { name: "localidad",        desde: 62,  longitud: 20 },
  { name: "cuit",             desde: 82,  longitud: 11 },
  { name: "numero_documento", desde: 113, longitud: 12 },
  { name: "tipo_persona",     desde: 212, longitud: 1  },
  { name: "telefono",         desde: 213, longitud: 30 },
  { name: "nombre",           desde: 243, longitud: 60 },
];

/** §4.3.13 Polizas2 — Pólizas (archivo principal). */
export const POLIZAS2_LAYOUT: FixedLayout = [
  { name: "rama", desde: 1, longitud: 2 },
  { name: "poliza", desde: 3, longitud: 7 },
  { name: "asegurado", desde: 10, longitud: 8 },
  { name: "vig_inicial", desde: 18, longitud: 8 },
  { name: "vig_final", desde: 26, longitud: 8 },
  { name: "anulada", desde: 62, longitud: 1 },
];

/**
 * §4.3.14 RieAut — Riesgo automotor (1 fila por vehículo / riesgo).
 * estado_riesgo: 'A' = activo / 'B' = baja.
 * Importes de 13/16 chars con 2 decimales implícitos.
 */
export const RIEAUT_LAYOUT: FixedLayout = [
  { name: "rama",                  desde: 1,   longitud: 2  },
  { name: "poliza",                desde: 3,   longitud: 7  },
  { name: "nro_riesgo",            desde: 10,  longitud: 4  },
  { name: "suplemento",            desde: 14,  longitud: 3  },
  { name: "estado_riesgo",         desde: 17,  longitud: 1  },
  { name: "patente",               desde: 27,  longitud: 10 },
  { name: "valor_asegurado",       desde: 84,  longitud: 13 },
  { name: "codigo_cobertura",      desde: 169, longitud: 2  },
  { name: "premio",                desde: 391, longitud: 16 },
  { name: "fecha_inicio_vigencia", desde: 407, longitud: 8  },
  { name: "fecha_fin_vigencia",    desde: 415, longitud: 8  },
];

/**
 * §4.3.X rieinc / riecer — Riesgos multi-cobertura (incendio, cerramiento, etc.).
 * Hasta 12 coberturas; cada una ocupa 4 chars (código) + 13 chars (capital).
 * Los importes tienen 2 decimales implícitos (igual que rieaut).
 */
const RIE_CAPITAL_FIELDS: FixedLayout = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => ({
  name: `capital_cob_${i}`,
  desde: 62 + (i - 1) * 17 + 4,
  longitud: 13,
}));

export const RIEINC_LAYOUT: FixedLayout = [
  { name: "rama",   desde: 1, longitud: 2 },
  { name: "poliza", desde: 3, longitud: 7 },
  ...RIE_CAPITAL_FIELDS,
];

export const RIECER_LAYOUT: FixedLayout = [
  { name: "rama",   desde: 1, longitud: 2 },
  { name: "poliza", desde: 3, longitud: 7 },
  ...RIE_CAPITAL_FIELDS,
];

/** §4.3.1 ramas — Tabla de ramas (tipos de seguro). */
export const RAMAS_LAYOUT: FixedLayout = [
  { name: "codigo", desde: 1, longitud: 2  },
  { name: "descripcion", desde: 3, longitud: 17 },
];

/** §4.3.2 cobert — Tabla de coberturas. */
export const COBERT_LAYOUT: FixedLayout = [
  { name: "codigo",      desde: 1,  longitud: 2  },
  { name: "descripcion", desde: 3,  longitud: 30 },
];

/** §4.3.22 movimi — Movimientos (primas, impuestos, endosos). */
export const MOVIMI_LAYOUT: FixedLayout = [
  { name: "rama", desde: 1, longitud: 2 },
  { name: "poliza", desde: 3, longitud: 7 },
  { name: "suplemento", desde: 10, longitud: 3 },
  { name: "numero_endoso", desde: 13, longitud: 7 },
  { name: "fecha_emision", desde: 20, longitud: 8 },
  { name: "prima", desde: 52, longitud: 13 },
  { name: "premio", desde: 65, longitud: 13 },
  { name: "premio_cobrado", desde: 78, longitud: 13 },
];

/** §4.3.24 cdp — Certificado de Pago (cuotas y cobranza por cuota). */
export const CDP_LAYOUT: FixedLayout = [
  { name: "rama", desde: 1, longitud: 2 },
  { name: "poliza", desde: 3, longitud: 7 },
  { name: "suplemento", desde: 10, longitud: 3 },
  { name: "numero_cuota", desde: 13, longitud: 2 },
  { name: "vencimiento", desde: 15, longitud: 8 },
  { name: "importe_cuota", desde: 23, longitud: 13 },
  { name: "importe_cobrado", desde: 36, longitud: 13 },
  { name: "moneda", desde: 49, longitud: 1 },
];

/** §4.3.23 pagos — Pagos recibidos. */
export const PAGOS_LAYOUT: FixedLayout = [
  { name: "rama", desde: 1, longitud: 2 },
  { name: "poliza", desde: 3, longitud: 7 },
  { name: "suplemento", desde: 10, longitud: 3 },
  { name: "fecha_ingreso", desde: 13, longitud: 8 },
  { name: "numero_pago", desde: 21, longitud: 2 },
  { name: "importe_pago", desde: 23, longitud: 13 },
];

/** Mapa de archivo (nombre base en minúsculas, sin extensión) → layout. */
export const LAYOUTS_BY_FILE: Record<string, FixedLayout> = {
  asegur:   ASEGUR_LAYOUT,
  polizas2: POLIZAS2_LAYOUT,
  movimi:   MOVIMI_LAYOUT,
  rieaut:   RIEAUT_LAYOUT,
  rieinc:   RIEINC_LAYOUT,
  riecer:   RIECER_LAYOUT,
  ramas:    RAMAS_LAYOUT,
  cobert:   COBERT_LAYOUT,
  cdp:      CDP_LAYOUT,
  pagos:    PAGOS_LAYOUT,
};

/** Normaliza "Polizas2.txt" → "polizas2". */
export function layoutKeyFromFilename(filename: string): string {
  return filename
    .trim()
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, "");
}
