import type { PolizaEstado, SiniestroEstado } from "@/lib/domain/poliza-status";

export type ClienteTipo = "corp" | "normal";
export type ClienteEstado = "activo" | "baja";

export type ClienteListItem = {
  id: number;
  tipo: ClienteTipo;
  label: string;
  ident: string;
  email: string | null;
  telefono: string | null;
  estado: ClienteEstado | null;
  desde: string | null;
  polizasActivas: number;
  primaMensual: number;
};

export type ClienteFull = ClienteListItem & {
  direccion: string | null;
  contactoNombre: string | null;
  primaAnualizada: number;
  siniestrosCount: number;
};

export type AseguradoraListItem = {
  id: number;
  razonSocial: string;
  cuit: string;
  contacto: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  color: string;
  polizasActivas: number;
  primaMensual: number;
  pctCartera: number;
};

export type PolizaClienteRef = {
  id: number;
  tipo: ClienteTipo;
  label: string;
  ident: string;
  avatarLetters: string;
};

export type PolizaAseguradoraRef = {
  id: number;
  razonSocial: string;
  color: string;
};

export type PolizaListItem = {
  id: number;
  numero: string;
  tipo: string | null;
  cobertura: string | null;
  inicio: string | null;
  fin: string | null;
  suma: number;
  prima: number;
  estado: PolizaEstado;
  diasHastaVencimiento: number | null;
  cliente: PolizaClienteRef;
  aseguradora: PolizaAseguradoraRef;
};

export type PolizaFull = PolizaListItem & {
  emision: string | null;
};

export type SiniestroDoc = {
  tipo: "img" | "pdf";
  nombre: string;
  tamano: string | null;
  procesadoIA: boolean;
};

export type SiniestroClienteRef = {
  id: number;
  tipo: ClienteTipo;
  label: string;
  ident: string;
  avatarLetters: string;
};

export type SiniestroListItem = {
  id: number;
  numero: string | null;
  titulo: string | null;
  descripcion: string | null;
  cliente: SiniestroClienteRef;
  fechaReporte: string | null;
  estado: SiniestroEstado;
  fuente: "whatsapp" | "email" | null;
  leido: boolean;
  docsCount: number;
};

export type SiniestroFull = SiniestroListItem & {
  fechaOcurrencia: string | null;
  aiSummary: string | null;
  docs: SiniestroDoc[];
  poliza: {
    id: number;
    numero: string;
    tipo: string | null;
    cobertura: string | null;
    suma: number;
    aseguradora: { id: number; razonSocial: string; color: string };
  } | null;
};

export type PagoEstado = "pendiente" | "validado" | "rechazado";

export type PagoListItem = {
  id: number;
  cliente: PolizaClienteRef;
  fechaEmision: string | null;
  periodo: string | null;
  estado: PagoEstado;
  metodoPago: string | null;
  montoTotal: number;
  itemsCount: number;
};

export type PagoItemDetail = {
  id: number;
  concepto: string | null;
  monto: number;
  poliza: {
    id: number;
    numero: string;
    tipo: string | null;
    aseguradora: { id: number; razonSocial: string; color: string };
  };
};

export type PagoFull = PagoListItem & {
  comprobante: string | null;
  cbu: string | null;
  items: PagoItemDetail[];
};

export type DashboardKPIs = {
  clientesActivos: number;
  polizasVigentes: number;
  siniestrosTramite: number;
  primaMensual: number;
};

export type SidebarBadges = {
  siniestrosNuevos: number;
  polizasPorVencer: number;
};
