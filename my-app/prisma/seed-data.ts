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
  contacto: string;
  email: string;
  telefono: string;
  direccion: string;
  color: string;
};

export type PolizaSeed = {
  id: string;
  numero: string;
  clienteId: string;
  aseguradoraId: string;
  tipo: string;
  cobertura: string;
  emision: string;
  inicio: string;
  fin: string;
  suma: number;
  prima: number;
  estado: "vigente" | "proxima" | "vencida" | "anulada" | "renovada";
};

export type SiniestroDocSeed = {
  tipo: "img" | "pdf";
  nombre: string;
  tamano: string;
  ai: boolean;
};

export type SiniestroSeed = {
  id: string;
  numero: string;
  clienteId: string;
  polizaId: string;
  fecha: string;
  fechaReporte: string;
  estado: "nuevo" | "tramite" | "cerrado";
  titulo: string;
  descripcion: string;
  fuente: "whatsapp" | "email";
  leido: boolean;
  docs: SiniestroDocSeed[];
  aiSummary: string;
};

export type PagoItemSeed = {
  polizaId: string;
  concepto: string;
  monto: number;
};

export type PagoSeed = {
  id: string;
  clienteId: string;
  fechaEmision: string;
  periodo: string;
  estado: "pendiente" | "validado";
  metodoPago: string;
  comprobante: string;
  cbu: string;
  items: PagoItemSeed[];
};

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
  { id: "A01", razonSocial: "La Federal Seguros S.A.",          cuit: "30-50001234-1", contacto: "Pablo Granados",   email: "productores@lafederal.com.ar", telefono: "+54 11 4339-9000",  direccion: "Av. Corrientes 1380, CABA",     color: "#1e5fc7" },
  { id: "A02", razonSocial: "Sancor Cooperativa de Seguros",    cuit: "30-50002378-8", contacto: "Verónica Calabró", email: "canales@sancor.com.ar",        telefono: "+54 3493 42-8000",  direccion: "Tucumán 2761, Sunchales",       color: "#0d8a5f" },
  { id: "A03", razonSocial: "Provincia ART",                    cuit: "30-50091344-2", contacto: "Marcelo Filloy",   email: "convenios@provinciaart.com.ar",telefono: "+54 11 4378-3300",  direccion: "Carlos Pellegrini 91, CABA",    color: "#7c3aed" },
  { id: "A04", razonSocial: "Galicia Seguros S.A.",             cuit: "30-66891022-5", contacto: "Luciana Frondizi", email: "productores@galiciaseguros.com.ar", telefono: "+54 11 6329-0000", direccion: "Tte. Gral. J.D. Perón 456, CABA", color: "#d97706" },
  { id: "A05", razonSocial: "Mercantil Andina",                 cuit: "30-50001876-3", contacto: "Gustavo Lerner",   email: "lerner@mercantilandina.com.ar", telefono: "+54 261 405-9000", direccion: "Av. España 1242, Mendoza",      color: "#b42318" },
];

// =============================================================================
// PÓLIZAS (18)
// =============================================================================

export const POLIZAS: PolizaSeed[] = [
  { id: "P-2024-0918", numero: "AUT-918274", clienteId: "C002", aseguradoraId: "A01", tipo: "Automotor",            cobertura: "Todo Riesgo c/ Franquicia",          emision: "2025-08-12", inicio: "2025-09-01", fin: "2026-08-31", suma: 18500000,  prima:    38400, estado: "vigente"  },
  { id: "P-2024-1145", numero: "HOG-441098", clienteId: "C002", aseguradoraId: "A04", tipo: "Hogar",                cobertura: "Combinado Familiar Plus",            emision: "2025-04-22", inicio: "2025-05-01", fin: "2026-05-15", suma: 42000000,  prima:    45900, estado: "proxima"  },
  { id: "P-2023-7782", numero: "FLO-220011", clienteId: "C001", aseguradoraId: "A02", tipo: "Flota Automotor",      cobertura: "Responsabilidad Civil + Robo",       emision: "2025-01-08", inicio: "2025-02-01", fin: "2026-01-31", suma: 580000000, prima:  2840000, estado: "vigente"  },
  { id: "P-2024-2231", numero: "ART-885672", clienteId: "C001", aseguradoraId: "A03", tipo: "ART",                  cobertura: "Riesgos del Trabajo",                emision: "2025-06-15", inicio: "2025-07-01", fin: "2026-06-30", suma: 0,         prima:  1280000, estado: "vigente"  },
  { id: "P-2024-0011", numero: "INT-103298", clienteId: "C003", aseguradoraId: "A05", tipo: "Integral de Comercio", cobertura: "Combinado + Cristales + Cyber",      emision: "2025-03-04", inicio: "2025-04-01", fin: "2026-03-31", suma: 1240000000,prima:  5210000, estado: "vigente"  },
  { id: "P-2024-0334", numero: "AUT-552108", clienteId: "C004", aseguradoraId: "A01", tipo: "Automotor",            cobertura: "Terceros Completo",                  emision: "2025-09-19", inicio: "2025-10-01", fin: "2026-05-22", suma: 9800000,   prima:    28100, estado: "proxima"  },
  { id: "P-2024-0902", numero: "VID-008712", clienteId: "C004", aseguradoraId: "A04", tipo: "Vida Individual",      cobertura: "Vida + Invalidez",                   emision: "2024-11-30", inicio: "2024-12-01", fin: "2025-11-30", suma: 60000000,  prima:    67800, estado: "renovada" },
  { id: "P-2025-0188", numero: "ART-993341", clienteId: "C005", aseguradoraId: "A03", tipo: "ART",                  cobertura: "Riesgos del Trabajo",                emision: "2025-02-22", inicio: "2025-03-01", fin: "2026-02-28", suma: 0,         prima:  4120000, estado: "vigente"  },
  { id: "P-2025-0210", numero: "FLO-771820", clienteId: "C005", aseguradoraId: "A02", tipo: "Flota Automotor",      cobertura: "Todo Riesgo Premium",                emision: "2025-05-11", inicio: "2025-06-01", fin: "2026-05-31", suma: 980000000, prima:  3700000, estado: "proxima"  },
  { id: "P-2024-1530", numero: "HOG-228174", clienteId: "C007", aseguradoraId: "A01", tipo: "Hogar",                cobertura: "Edificio + Contenido",               emision: "2025-07-08", inicio: "2025-08-01", fin: "2026-07-31", suma: 95000000,  prima:    89200, estado: "vigente"  },
  { id: "P-2024-1531", numero: "AUT-882013", clienteId: "C007", aseguradoraId: "A02", tipo: "Automotor",            cobertura: "Todo Riesgo",                        emision: "2025-07-08", inicio: "2025-08-01", fin: "2026-07-31", suma: 24700000,  prima:    49800, estado: "vigente"  },
  { id: "P-2024-1532", numero: "VID-118472", clienteId: "C007", aseguradoraId: "A04", tipo: "Vida Individual",      cobertura: "Vida Premium",                       emision: "2024-08-19", inicio: "2024-09-01", fin: "2025-08-31", suma: 80000000,  prima:    79900, estado: "anulada"  },
  { id: "P-2024-2018", numero: "AGR-770251", clienteId: "C008", aseguradoraId: "A02", tipo: "Agrícola",             cobertura: "Granizo + Multirriesgo",             emision: "2025-09-12", inicio: "2025-10-01", fin: "2026-09-30", suma: 320000000, prima:  1640000, estado: "vigente"  },
  { id: "P-2024-2240", numero: "AUT-110289", clienteId: "C010", aseguradoraId: "A05", tipo: "Automotor",            cobertura: "Todo Riesgo",                        emision: "2025-08-29", inicio: "2025-09-01", fin: "2026-05-18", suma: 32000000,  prima:    62400, estado: "proxima"  },
  { id: "P-2024-2241", numero: "AUT-110290", clienteId: "C010", aseguradoraId: "A05", tipo: "Automotor",            cobertura: "Terceros Completo",                  emision: "2024-04-15", inicio: "2024-05-01", fin: "2025-04-30", suma: 12000000,  prima:    31200, estado: "vencida"  },
  { id: "P-2025-0044", numero: "INT-409812", clienteId: "C011", aseguradoraId: "A01", tipo: "Integral de Comercio", cobertura: "Combinado Distribución",             emision: "2025-01-19", inicio: "2025-02-01", fin: "2026-01-31", suma: 480000000, prima:  1980000, estado: "vigente"  },
  { id: "P-2025-0045", numero: "FLO-208917", clienteId: "C011", aseguradoraId: "A02", tipo: "Flota Automotor",      cobertura: "Todo Riesgo Flota",                  emision: "2025-01-19", inicio: "2025-02-01", fin: "2026-01-31", suma: 380000000, prima:  1970000, estado: "vigente"  },
  { id: "P-2024-1104", numero: "HOG-309218", clienteId: "C012", aseguradoraId: "A01", tipo: "Hogar",                cobertura: "Combinado Familiar",                 emision: "2025-08-22", inicio: "2025-09-01", fin: "2026-08-31", suma: 28000000,  prima:    38900, estado: "vigente"  },
];

// =============================================================================
// SINIESTROS (8)
// =============================================================================

export const SINIESTROS: SiniestroSeed[] = [
  {
    id: "S-2026-0118", numero: "SIN-2026-0118",
    clienteId: "C002", polizaId: "P-2024-0918",
    fecha: "2026-05-07", fechaReporte: "2026-05-07T18:42:00",
    estado: "nuevo",
    titulo: "Choque trasero en Av. Cabildo y Juramento",
    descripcion: "Conduciendo por Av. Cabildo, fui chocada en la parte trasera por un Volkswagen Gol blanco al detenerme en el semáforo. El conductor reconoció su responsabilidad. Hay daños visibles en paragolpes y baúl. Adjunto fotos del vehículo y de la denuncia policial.",
    fuente: "whatsapp", leido: false,
    docs: [
      { tipo: "img", nombre: "frente_auto.jpg",        tamano: "2.4 MB", ai: true },
      { tipo: "img", nombre: "danos_atras.jpg",        tamano: "3.1 MB", ai: true },
      { tipo: "img", nombre: "patente_otro.jpg",       tamano: "1.8 MB", ai: true },
      { tipo: "pdf", nombre: "denuncia_policial.pdf",  tamano: "0.4 MB", ai: false },
    ],
    aiSummary: "Siniestro de tránsito con responsabilidad de tercero identificada. Daños materiales estimados moderados (paragolpes y baúl). Documentación completa: 3 fotos + denuncia policial. Recomendación: derivar a perito asignado.",
  },
  {
    id: "S-2026-0117", numero: "SIN-2026-0117",
    clienteId: "C001", polizaId: "P-2023-7782",
    fecha: "2026-05-06", fechaReporte: "2026-05-06T11:15:00",
    estado: "nuevo",
    titulo: "Robo de unidad de flota — Iveco Daily 35-150",
    descripcion: "El conductor reportó robo de la unidad mientras realizaba una entrega en Avellaneda. La denuncia policial fue radicada en la Comisaría 3a. Se solicita activación urgente de la cobertura de Robo Total.",
    fuente: "whatsapp", leido: false,
    docs: [
      { tipo: "pdf", nombre: "denuncia_robo.pdf",      tamano: "0.6 MB", ai: false },
      { tipo: "img", nombre: "ultima_ubicacion.jpg",   tamano: "0.9 MB", ai: true  },
    ],
    aiSummary: "Robo total de unidad comercial. Denuncia policial adjunta. Caso de alta prioridad: requiere activación inmediata de cobertura por Robo y notificación a aseguradora dentro de las 72hs.",
  },
  {
    id: "S-2026-0116", numero: "SIN-2026-0116",
    clienteId: "C003", polizaId: "P-2024-0011",
    fecha: "2026-05-04", fechaReporte: "2026-05-04T09:30:00",
    estado: "tramite",
    titulo: "Daños por inundación en planta — sector congelado",
    descripcion: "Lluvias intensas el fin de semana provocaron filtración en techo del sector cámara N°3, dañando productos refrigerados y equipo de compresor.",
    fuente: "email", leido: true,
    docs: [
      { tipo: "img", nombre: "techo_filtra.jpg",          tamano: "1.7 MB", ai: true  },
      { tipo: "img", nombre: "camara_3.jpg",              tamano: "2.2 MB", ai: true  },
      { tipo: "pdf", nombre: "presupuesto_compresor.pdf", tamano: "0.3 MB", ai: false },
      { tipo: "pdf", nombre: "lista_productos_perdidos.pdf", tamano: "0.2 MB", ai: false },
    ],
    aiSummary: "Daño por evento climático. Presupuesto de reparación adjunto: AR$ 8.4M. Se estima daño en mercadería perecedera. Pendiente: visita de perito designado.",
  },
  {
    id: "S-2026-0115", numero: "SIN-2026-0115",
    clienteId: "C004", polizaId: "P-2024-0334",
    fecha: "2026-04-29", fechaReporte: "2026-04-29T20:11:00",
    estado: "tramite",
    titulo: "Granizo — daños en techo y vidrios",
    descripcion: "Tormenta de granizo afectó el vehículo estacionado en la vía pública. Múltiples abolladuras en techo, capot y rotura del parabrisas trasero.",
    fuente: "whatsapp", leido: true,
    docs: [
      { tipo: "img", nombre: "techo.jpg",  tamano: "2.1 MB", ai: true },
      { tipo: "img", nombre: "capot.jpg",  tamano: "1.9 MB", ai: true },
      { tipo: "img", nombre: "luneta.jpg", tamano: "2.4 MB", ai: true },
    ],
    aiSummary: "Daños múltiples por granizo. Abolladuras en chapa y rotura de cristales. Cobertura aplicable. Pendiente: elección de taller homologado.",
  },
  {
    id: "S-2026-0114", numero: "SIN-2026-0114",
    clienteId: "C005", polizaId: "P-2025-0188",
    fecha: "2026-04-25", fechaReporte: "2026-04-25T14:22:00",
    estado: "tramite",
    titulo: "Accidente laboral — caída en obra (ART)",
    descripcion: "Operario de la obra Núñez sufrió caída desde andamio a 2.5m de altura. Trasladado a Hospital Pirovano. Lesión: fractura de tobillo izquierdo.",
    fuente: "email", leido: true,
    docs: [
      { tipo: "pdf", nombre: "denuncia_art.pdf",   tamano: "0.4 MB", ai: false },
      { tipo: "pdf", nombre: "informe_medico.pdf", tamano: "0.7 MB", ai: false },
    ],
    aiSummary: "Accidente laboral con baja médica estimada 30 días. ART activada. Pendiente: alta médica del paciente.",
  },
  {
    id: "S-2026-0113", numero: "SIN-2026-0113",
    clienteId: "C007", polizaId: "P-2024-1531",
    fecha: "2026-04-22", fechaReporte: "2026-04-22T08:45:00",
    estado: "tramite",
    titulo: "Robo de espejos retrovisores",
    descripcion: "Vehículo estacionado frente al domicilio amaneció sin los espejos retrovisores. Sin daños adicionales.",
    fuente: "whatsapp", leido: true,
    docs: [
      { tipo: "img", nombre: "auto_sin_espejo.jpg", tamano: "1.2 MB", ai: true  },
      { tipo: "pdf", nombre: "exposicion.pdf",      tamano: "0.2 MB", ai: false },
    ],
    aiSummary: "Robo parcial de accesorios. Cobertura Todo Riesgo aplica. Reposición estimada: AR$ 380.000.",
  },
  {
    id: "S-2026-0112", numero: "SIN-2026-0112",
    clienteId: "C010", polizaId: "P-2024-2240",
    fecha: "2026-04-15", fechaReporte: "2026-04-15T17:00:00",
    estado: "cerrado",
    titulo: "Choque en estacionamiento — daños menores",
    descripcion: "Otro vehículo abrió la puerta y rayó el lateral. Conductor identificado, pago directo aceptado.",
    fuente: "whatsapp", leido: true,
    docs: [
      { tipo: "img", nombre: "rayadura.jpg", tamano: "0.9 MB", ai: true },
    ],
    aiSummary: "Caso cerrado por acuerdo entre partes. No requirió uso de cobertura.",
  },
  {
    id: "S-2026-0111", numero: "SIN-2026-0111",
    clienteId: "C008", polizaId: "P-2024-2018",
    fecha: "2026-04-08", fechaReporte: "2026-04-08T10:30:00",
    estado: "cerrado",
    titulo: "Pérdida de cosecha por granizo — Lote 7",
    descripcion: "Granizo afectó 240 ha de soja en estado R5. Daño verificado por perito.",
    fuente: "email", leido: true,
    docs: [
      { tipo: "pdf", nombre: "informe_perito.pdf", tamano: "1.2 MB", ai: false },
      { tipo: "img", nombre: "lote_7_aerea.jpg",   tamano: "3.8 MB", ai: true  },
    ],
    aiSummary: "Siniestro agrícola cerrado. Indemnización liquidada: AR$ 18.4M. Cobertura Granizo aplicada.",
  },
];

// =============================================================================
// PAGOS MASIVOS (5)
// =============================================================================

export const PAGOS: PagoSeed[] = [
  {
    id: "PG-2026-0042", clienteId: "C005", fechaEmision: "2026-05-05", periodo: "Mayo 2026",
    estado: "pendiente", metodoPago: "Transferencia bancaria", comprobante: "TRF-558891204", cbu: "0070****5512345678",
    items: [
      { polizaId: "P-2025-0188", concepto: "ART — Cuota 5/12",              monto: 4120000 },
      { polizaId: "P-2025-0210", concepto: "Flota Automotor — Cuota 5/12",  monto: 3700000 },
    ],
  },
  {
    id: "PG-2026-0041", clienteId: "C001", fechaEmision: "2026-05-04", periodo: "Mayo 2026",
    estado: "pendiente", metodoPago: "Transferencia bancaria", comprobante: "TRF-998812301", cbu: "0110****1188224410",
    items: [
      { polizaId: "P-2023-7782", concepto: "Flota Automotor — Cuota 5/12",  monto: 2840000 },
      { polizaId: "P-2024-2231", concepto: "ART — Cuota 5/12",              monto: 1280000 },
    ],
  },
  {
    id: "PG-2026-0040", clienteId: "C003", fechaEmision: "2026-05-02", periodo: "Mayo 2026",
    estado: "validado", metodoPago: "Transferencia bancaria", comprobante: "TRF-441298033", cbu: "0140****8865210394",
    items: [
      { polizaId: "P-2024-0011", concepto: "Integral Comercio — Cuota 5/12", monto: 5210000 },
    ],
  },
  {
    id: "PG-2026-0039", clienteId: "C011", fechaEmision: "2026-05-02", periodo: "Mayo 2026",
    estado: "validado", metodoPago: "Cheque diferido", comprobante: "CHQ-00084492", cbu: "—",
    items: [
      { polizaId: "P-2025-0044", concepto: "Integral Comercio — Cuota 5/12", monto: 1980000 },
      { polizaId: "P-2025-0045", concepto: "Flota Automotor — Cuota 5/12",   monto: 1970000 },
    ],
  },
  {
    id: "PG-2026-0038", clienteId: "C008", fechaEmision: "2026-04-30", periodo: "Abril 2026",
    estado: "validado", metodoPago: "Transferencia bancaria", comprobante: "TRF-220194812", cbu: "0072****3392001876",
    items: [
      { polizaId: "P-2024-2018", concepto: "Agrícola — Cuota 4/12", monto: 1640000 },
    ],
  },
];
