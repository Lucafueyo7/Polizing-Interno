/**
 * Datos del prototipo (Polizing/src/data.js) portados a TypeScript.
 * Fuente única de verdad para `prisma/seed.ts`.
 */

export type ClienteSeed =
  | {
      id: string;
      tipo: "corp";
      razonSocial: string;
      cuit: string;
      contactoNombre: string;
      email: string;
      telefono: string;
      estado: "activo" | "baja";
      direccion: string;
      desde: string;
    }
  | {
      id: string;
      tipo: "normal";
      nombre: string;
      apellido: string;
      dni: string;
      email: string;
      telefono: string;
      estado: "activo" | "baja";
      direccion: string;
      desde: string;
    };

export type AseguradoraSeed = {
  id: string;
  razonSocial: string;
  cuit: string;
  email: string;
  telefono: string;
};

export type CategoriaSeguroSeed =
  | "auto"
  | "vida"
  | "hogar"
  | "salud"
  | "comercio"
  | "art"
  | "agricola"
  | "otros";

export type TipoSeguroSeed = {
  nombre: string;
  categoria: CategoriaSeguroSeed;
  descripcion?: string;
  /** Catálogo de coberturas válidas para este tipo de seguro. */
  coberturas: { nombre: string; descripcion?: string }[];
};

export type PolizaSeed = {
  id: string;
  numero: string;
  clienteId: string;
  aseguradoraId: string;
  tipo: string;
  /** Nombre de la cobertura dentro del catálogo del `tipo`. Se resuelve a `cobertura_id` en seed.ts. */
  cobertura: string;
  inicio: string;
  fin: string;
  suma: number;
  prima: number;
  estado: "vigente" | "proxima" | "vencida" | "anulada" | "renovada";
};

export type SiniestroDocSeed = {
  tipo: "img" | "pdf";
  nombre: string;
};

export type SiniestroSeed = {
  id: string;
  numero: string;
  polizaId: string;
  fecha: string;
  fechaReporte: string;
  estado: "nuevo" | "pendiente_documentacion" | "en_tramite" | "cerrado" | "rechazado";
  titulo: string;
  docs: SiniestroDocSeed[];
};

export type MetodoPagoSeed =
  | "transferencia"
  | "debito_automatico"
  | "tarjeta_credito"
  | "tarjeta_debito"
  | "efectivo"
  | "mercadopago"
  | "cheque"
  | "otro";

export type PagoSeed = {
  id: string;
  clienteId: string;
  estado: "pendiente" | "validado";
  metodoPago: MetodoPagoSeed;
  fechaPago: string | null;
  monto: number;
  /** Pólizas que cubre el pago (1 pago : N pólizas). */
  polizaIds: string[];
};

// =============================================================================
// TIPOS DE SEGURO + CATÁLOGO DE COBERTURAS
// =============================================================================

export const TIPOS_SEGURO: TipoSeguroSeed[] = [
  {
    nombre: "Automotor",
    categoria: "auto",
    descripcion: "Seguro de vehículo particular",
    coberturas: [
      { nombre: "responsabilidad_civil", descripcion: "Solo daños a terceros" },
      { nombre: "terceros_completo",     descripcion: "Terceros + robo e incendio" },
      { nombre: "todo_riesgo",           descripcion: "Cobertura integral incluyendo daños propios" },
    ],
  },
  {
    nombre: "Flota Automotor",
    categoria: "auto",
    descripcion: "Seguro para flotas comerciales",
    coberturas: [
      { nombre: "responsabilidad_civil", descripcion: "Solo daños a terceros (flota)" },
      { nombre: "todo_riesgo",           descripcion: "Cobertura integral por unidad" },
    ],
  },
  {
    nombre: "Hogar",
    categoria: "hogar",
    descripcion: "Seguro de vivienda",
    coberturas: [
      { nombre: "basica",   descripcion: "Incendio + responsabilidad civil" },
      { nombre: "integral", descripcion: "Incluye robo, daños eléctricos y cristales" },
    ],
  },
  {
    nombre: "ART",
    categoria: "art",
    descripcion: "Aseguradora de Riesgos del Trabajo",
    coberturas: [
      { nombre: "basica", descripcion: "Cobertura legal obligatoria de ART" },
    ],
  },
  {
    nombre: "Integral de Comercio",
    categoria: "comercio",
    descripcion: "Seguro para locales comerciales",
    coberturas: [
      { nombre: "integral", descripcion: "Incendio, robo, cristales y responsabilidad civil" },
    ],
  },
  {
    nombre: "Vida Individual",
    categoria: "vida",
    descripcion: "Seguro de vida personal",
    coberturas: [
      { nombre: "basica",   descripcion: "Cobertura por muerte" },
      { nombre: "integral", descripcion: "Muerte + invalidez total y permanente" },
    ],
  },
  {
    nombre: "Agrícola",
    categoria: "agricola",
    descripcion: "Seguro de cultivos",
    coberturas: [
      { nombre: "integral", descripcion: "Multirriesgo agrícola (granizo, helada, sequía)" },
    ],
  },
];

// =============================================================================
// CLIENTES (12)
// =============================================================================

export const CLIENTES: ClienteSeed[] = [
  { id: "C001", tipo: "corp",   razonSocial: "Logística del Sur S.A.",       cuit: "30-71045892-7", contactoNombre: "Mariano Pereyra",   email: "operaciones@logisticadelsur.com.ar", telefono: "+54 11 4892-1003",  estado: "activo", direccion: "Av. del Libertador 4521, Vicente López, BA",   desde: "2021-03-12" },
  { id: "C002", tipo: "normal", nombre: "Sofía", apellido: "Mansilla",       dni:  "32.450.198",    email: "sofia.mansilla@gmail.com",            telefono: "+54 11 5634-7821",  estado: "activo", direccion: "Tucumán 1280 4°B, CABA",                       desde: "2023-08-04" },
  { id: "C003", tipo: "corp",   razonSocial: "Frigorífico Las Heras S.R.L.", cuit: "30-69384761-2", contactoNombre: "Andrea Cabezas",     email: "compras@frigolasheras.com.ar",        telefono: "+54 261 423-9018",  estado: "activo", direccion: "Ruta 7 km 1042, Las Heras, Mendoza",            desde: "2019-11-20" },
  { id: "C004", tipo: "normal", nombre: "Lucas", apellido: "Bressán",        dni:  "28.917.044",    email: "lucas.bressan@hotmail.com",           telefono: "+54 351 612-4488",  estado: "activo", direccion: "Bv. Chacabuco 980, Córdoba",                    desde: "2022-02-18" },
  { id: "C005", tipo: "corp",   razonSocial: "Constructora Andina S.A.",     cuit: "30-70812346-9", contactoNombre: "Federico Ítalo",     email: "italo@constructoraandina.com.ar",     telefono: "+54 11 4313-7700",  estado: "activo", direccion: "San Martín 200 P10, CABA",                      desde: "2020-06-09" },
  { id: "C006", tipo: "normal", nombre: "Carolina", apellido: "Iturralde",   dni:  "35.108.276",    email: "carolina.iturralde@yahoo.com.ar",     telefono: "+54 223 481-9920",  estado: "baja",   direccion: "Mitre 3402, Mar del Plata",                     desde: "2024-01-15" },
  { id: "C007", tipo: "normal", nombre: "Diego", apellido: "Quintana",       dni:  "30.781.633",    email: "diego.quintana@outlook.com",          telefono: "+54 11 6128-3045",  estado: "activo", direccion: "Honduras 4880, CABA",                           desde: "2021-09-27" },
  { id: "C008", tipo: "corp",   razonSocial: "AgroTech Pampa S.R.L.",        cuit: "30-71398205-4", contactoNombre: "Verónica Pini",      email: "vpini@agrotechpampa.com.ar",          telefono: "+54 2317 45-2901",  estado: "activo", direccion: "Av. San Martín 821, Pehuajó, BA",               desde: "2022-10-11" },
  { id: "C009", tipo: "normal", nombre: "Romina", apellido: "Ledesma",       dni:  "33.219.847",    email: "romi.ledesma@gmail.com",              telefono: "+54 11 5811-7720",  estado: "activo", direccion: "Migueletes 1430, CABA",                         desde: "2023-04-22" },
  { id: "C010", tipo: "normal", nombre: "Tomás", apellido: "Olmedo",         dni:  "29.504.612",    email: "tomas.olmedo@gmail.com",              telefono: "+54 11 6724-1899",  estado: "activo", direccion: "Av. Cabildo 2102, CABA",                        desde: "2020-12-03" },
  { id: "C011", tipo: "corp",   razonSocial: "Distribuidora Pampa Verde S.A.", cuit: "30-70234118-1", contactoNombre: "Esteban Rugiero", email: "rugiero@pampaverde.com.ar",           telefono: "+54 341 562-0044",  estado: "activo", direccion: "Pellegrini 1850, Rosario",                      desde: "2018-05-30" },
  { id: "C012", tipo: "normal", nombre: "Agustina", apellido: "Vázquez",     dni:  "34.882.301",    email: "agus.vazquez@gmail.com",              telefono: "+54 11 5028-3367",  estado: "activo", direccion: "Av. Las Heras 2890, CABA",                      desde: "2024-07-19" },
];

// =============================================================================
// ASEGURADORAS (5)
// =============================================================================

export const ASEGURADORAS: AseguradoraSeed[] = [
  { id: "A01", razonSocial: "La Federal Seguros S.A.",       cuit: "30-50001234-1", email: "productores@lafederal.com.ar",      telefono: "+54 11 4339-9000" },
  { id: "A02", razonSocial: "Sancor Cooperativa de Seguros", cuit: "30-50002378-8", email: "canales@sancor.com.ar",             telefono: "+54 3493 42-8000" },
  { id: "A03", razonSocial: "Provincia ART",                 cuit: "30-50091344-2", email: "convenios@provinciaart.com.ar",     telefono: "+54 11 4378-3300" },
  { id: "A04", razonSocial: "Galicia Seguros S.A.",          cuit: "30-66891022-5", email: "productores@galiciaseguros.com.ar", telefono: "+54 11 6329-0000" },
  { id: "A05", razonSocial: "Mercantil Andina",              cuit: "30-50001876-3", email: "lerner@mercantilandina.com.ar",     telefono: "+54 261 405-9000" },
];

// =============================================================================
// PÓLIZAS (18)
// =============================================================================

export const POLIZAS: PolizaSeed[] = [
  { id: "P-2024-0918", numero: "AUT-918274", clienteId: "C002", aseguradoraId: "A01", tipo: "Automotor",            cobertura: "todo_riesgo",          inicio: "2025-09-01", fin: "2026-08-31", suma: 18500000,  prima:    38400, estado: "vigente"  },
  { id: "P-2024-1145", numero: "HOG-441098", clienteId: "C002", aseguradoraId: "A04", tipo: "Hogar",                cobertura: "integral",             inicio: "2025-05-01", fin: "2026-05-15", suma: 42000000,  prima:    45900, estado: "proxima"  },
  { id: "P-2023-7782", numero: "FLO-220011", clienteId: "C001", aseguradoraId: "A02", tipo: "Flota Automotor",      cobertura: "responsabilidad_civil",inicio: "2025-02-01", fin: "2026-01-31", suma: 580000000, prima:  2840000, estado: "vigente"  },
  { id: "P-2024-2231", numero: "ART-885672", clienteId: "C001", aseguradoraId: "A03", tipo: "ART",                  cobertura: "basica",               inicio: "2025-07-01", fin: "2026-06-30", suma: 0,         prima:  1280000, estado: "vigente"  },
  { id: "P-2024-0011", numero: "INT-103298", clienteId: "C003", aseguradoraId: "A05", tipo: "Integral de Comercio", cobertura: "integral",             inicio: "2025-04-01", fin: "2026-03-31", suma: 1240000000,prima:  5210000, estado: "vigente"  },
  { id: "P-2024-0334", numero: "AUT-552108", clienteId: "C004", aseguradoraId: "A01", tipo: "Automotor",            cobertura: "terceros_completo",    inicio: "2025-10-01", fin: "2026-05-22", suma: 9800000,   prima:    28100, estado: "proxima"  },
  { id: "P-2024-0902", numero: "VID-008712", clienteId: "C004", aseguradoraId: "A04", tipo: "Vida Individual",      cobertura: "integral",             inicio: "2024-12-01", fin: "2025-11-30", suma: 60000000,  prima:    67800, estado: "renovada" },
  { id: "P-2025-0188", numero: "ART-993341", clienteId: "C005", aseguradoraId: "A03", tipo: "ART",                  cobertura: "basica",               inicio: "2025-03-01", fin: "2026-02-28", suma: 0,         prima:  4120000, estado: "vigente"  },
  { id: "P-2025-0210", numero: "FLO-771820", clienteId: "C005", aseguradoraId: "A02", tipo: "Flota Automotor",      cobertura: "todo_riesgo",          inicio: "2025-06-01", fin: "2026-05-31", suma: 980000000, prima:  3700000, estado: "proxima"  },
  { id: "P-2024-1530", numero: "HOG-228174", clienteId: "C007", aseguradoraId: "A01", tipo: "Hogar",                cobertura: "integral",             inicio: "2025-08-01", fin: "2026-07-31", suma: 95000000,  prima:    89200, estado: "vigente"  },
  { id: "P-2024-1531", numero: "AUT-882013", clienteId: "C007", aseguradoraId: "A02", tipo: "Automotor",            cobertura: "todo_riesgo",          inicio: "2025-08-01", fin: "2026-07-31", suma: 24700000,  prima:    49800, estado: "vigente"  },
  { id: "P-2024-1532", numero: "VID-118472", clienteId: "C007", aseguradoraId: "A04", tipo: "Vida Individual",      cobertura: "integral",             inicio: "2024-09-01", fin: "2025-08-31", suma: 80000000,  prima:    79900, estado: "anulada"  },
  { id: "P-2024-2018", numero: "AGR-770251", clienteId: "C008", aseguradoraId: "A02", tipo: "Agrícola",             cobertura: "integral",             inicio: "2025-10-01", fin: "2026-09-30", suma: 320000000, prima:  1640000, estado: "vigente"  },
  { id: "P-2024-2240", numero: "AUT-110289", clienteId: "C010", aseguradoraId: "A05", tipo: "Automotor",            cobertura: "todo_riesgo",          inicio: "2025-09-01", fin: "2026-05-18", suma: 32000000,  prima:    62400, estado: "proxima"  },
  { id: "P-2024-2241", numero: "AUT-110290", clienteId: "C010", aseguradoraId: "A05", tipo: "Automotor",            cobertura: "terceros_completo",    inicio: "2024-05-01", fin: "2025-04-30", suma: 12000000,  prima:    31200, estado: "vencida"  },
  { id: "P-2025-0044", numero: "INT-409812", clienteId: "C011", aseguradoraId: "A01", tipo: "Integral de Comercio", cobertura: "integral",             inicio: "2025-02-01", fin: "2026-01-31", suma: 480000000, prima:  1980000, estado: "vigente"  },
  { id: "P-2025-0045", numero: "FLO-208917", clienteId: "C011", aseguradoraId: "A02", tipo: "Flota Automotor",      cobertura: "todo_riesgo",          inicio: "2025-02-01", fin: "2026-01-31", suma: 380000000, prima:  1970000, estado: "vigente"  },
  { id: "P-2024-1104", numero: "HOG-309218", clienteId: "C012", aseguradoraId: "A01", tipo: "Hogar",                cobertura: "integral",             inicio: "2025-09-01", fin: "2026-08-31", suma: 28000000,  prima:    38900, estado: "vigente"  },
];

// =============================================================================
// SINIESTROS (8) — todos vienen por WhatsApp (único canal soportado)
// =============================================================================

export const SINIESTROS: SiniestroSeed[] = [
  {
    id: "S-2026-0118", numero: "SIN-2026-0118",
    polizaId: "P-2024-0918",
    fecha: "2026-05-07", fechaReporte: "2026-05-07T18:42:00",
    estado: "nuevo",
    titulo: "Choque trasero en Av. Cabildo y Juramento",
    docs: [
      { tipo: "img", nombre: "frente_auto.jpg" },
      { tipo: "img", nombre: "danos_atras.jpg" },
      { tipo: "img", nombre: "patente_otro.jpg" },
      { tipo: "pdf", nombre: "denuncia_policial.pdf" },
    ],
  },
  {
    id: "S-2026-0117", numero: "SIN-2026-0117",
    polizaId: "P-2023-7782",
    fecha: "2026-05-06", fechaReporte: "2026-05-06T11:15:00",
    estado: "nuevo",
    titulo: "Robo de unidad de flota — Iveco Daily 35-150",
    docs: [
      { tipo: "pdf", nombre: "denuncia_robo.pdf" },
      { tipo: "img", nombre: "ultima_ubicacion.jpg" },
    ],
  },
  {
    id: "S-2026-0116", numero: "SIN-2026-0116",
    polizaId: "P-2024-0011",
    fecha: "2026-05-04", fechaReporte: "2026-05-04T09:30:00",
    estado: "en_tramite",
    titulo: "Daños por inundación en planta — sector congelado",
    docs: [
      { tipo: "img", nombre: "techo_filtra.jpg" },
      { tipo: "img", nombre: "camara_3.jpg" },
      { tipo: "pdf", nombre: "presupuesto_compresor.pdf" },
      { tipo: "pdf", nombre: "lista_productos_perdidos.pdf" },
    ],
  },
  {
    id: "S-2026-0115", numero: "SIN-2026-0115",
    polizaId: "P-2024-0334",
    fecha: "2026-04-29", fechaReporte: "2026-04-29T20:11:00",
    estado: "en_tramite",
    titulo: "Granizo — daños en techo y vidrios",
    docs: [
      { tipo: "img", nombre: "techo.jpg" },
      { tipo: "img", nombre: "capot.jpg" },
      { tipo: "img", nombre: "luneta.jpg" },
    ],
  },
  {
    id: "S-2026-0114", numero: "SIN-2026-0114",
    polizaId: "P-2025-0188",
    fecha: "2026-04-25", fechaReporte: "2026-04-25T14:22:00",
    estado: "en_tramite",
    titulo: "Accidente laboral — caída en obra (ART)",
    docs: [
      { tipo: "pdf", nombre: "denuncia_art.pdf" },
      { tipo: "pdf", nombre: "informe_medico.pdf" },
    ],
  },
  {
    id: "S-2026-0113", numero: "SIN-2026-0113",
    polizaId: "P-2024-1531",
    fecha: "2026-04-22", fechaReporte: "2026-04-22T08:45:00",
    estado: "pendiente_documentacion",
    titulo: "Robo de espejos retrovisores",
    docs: [
      { tipo: "img", nombre: "auto_sin_espejo.jpg" },
      { tipo: "pdf", nombre: "exposicion.pdf" },
    ],
  },
  {
    id: "S-2026-0112", numero: "SIN-2026-0112",
    polizaId: "P-2024-2240",
    fecha: "2026-04-15", fechaReporte: "2026-04-15T17:00:00",
    estado: "cerrado",
    titulo: "Choque en estacionamiento — daños menores",
    docs: [
      { tipo: "img", nombre: "rayadura.jpg" },
    ],
  },
  {
    id: "S-2026-0111", numero: "SIN-2026-0111",
    polizaId: "P-2024-2018",
    fecha: "2026-04-08", fechaReporte: "2026-04-08T10:30:00",
    estado: "cerrado",
    titulo: "Pérdida de cosecha por granizo — Lote 7",
    docs: [
      { tipo: "pdf", nombre: "informe_perito.pdf" },
      { tipo: "img", nombre: "lote_7_aerea.jpg" },
    ],
  },
];

// =============================================================================
// PAGOS (5) — un pago agrupa N pólizas
// =============================================================================

export const PAGOS: PagoSeed[] = [
  {
    id: "PG-2026-0042", clienteId: "C005",
    estado: "pendiente", metodoPago: "transferencia",
    fechaPago: null,
    monto: 7820000,
    polizaIds: ["P-2025-0188", "P-2025-0210"],
  },
  {
    id: "PG-2026-0041", clienteId: "C001",
    estado: "pendiente", metodoPago: "transferencia",
    fechaPago: null,
    monto: 4120000,
    polizaIds: ["P-2023-7782", "P-2024-2231"],
  },
  {
    id: "PG-2026-0040", clienteId: "C003",
    estado: "validado", metodoPago: "transferencia",
    fechaPago: "2026-05-02",
    monto: 5210000,
    polizaIds: ["P-2024-0011"],
  },
  {
    id: "PG-2026-0039", clienteId: "C011",
    estado: "validado", metodoPago: "cheque",
    fechaPago: "2026-05-02",
    monto: 3950000,
    polizaIds: ["P-2025-0044", "P-2025-0045"],
  },
  {
    id: "PG-2026-0038", clienteId: "C008",
    estado: "validado", metodoPago: "transferencia",
    fechaPago: "2026-04-30",
    monto: 1640000,
    polizaIds: ["P-2024-2018"],
  },
];
