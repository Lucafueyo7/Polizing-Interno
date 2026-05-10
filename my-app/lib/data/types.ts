import type { PolizaEstado, SiniestroEstado } from "@/lib/domain/poliza-status";

export type ClienteTipo = "corp" | "normal";
export type ClienteEstado = "activo" | "baja";
export type CoberturaTipo =
  | "responsabilidad_civil"
  | "terceros_completo"
  | "todo_riesgo"
  | "basica"
  | "integral";

export type ClienteListItem = {
  id: number;
  tipo: ClienteTipo;
  label: string;
  ident: string;
  avatarLetters: string;
  email: string | null;
  telefono: string | null;
  estado: ClienteEstado;
  desde: string;
  polizasActivas: number;
  primaMensual: number;
};

export type ClienteFull = ClienteListItem & {
  direccion: string | null;
  contactoNombre: string | null;
  primaAnualizada: number;
  siniestrosCount: number;
  /** Campos crudos del child para prefill de formularios. */
  razonSocial: string | null;
  cuit: string | null;
  nombre: string | null;
  apellido: string | null;
  dni: string | null;
};

export type AseguradoraListItem = {
  id: number;
  razonSocial: string;
  cuit: string;
  email: string | null;
  telefono: string | null;
  contactoNombre: string | null;
  direccion: string | null;
  color: string;
  initials: string;
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

export type PolizaTab =
  | "all"
  | "vigente"
  | "proxima"
  | "porVencer"
  | "renovada"
  | "vencida"
  | "anulada";

export type PolizasFilters = {
  q?: string;
  tab?: PolizaTab;
  tipo?: string;
  aseguradoraId?: number;
};

export type PolizaCounts = Record<PolizaTab, number>;

export type FormCliente = {
  id: number;
  label: string;
  ident: string;
};

export type FormAseguradora = {
  id: number;
  razonSocial: string;
};

export type FormTipoSeguro = {
  id: number;
  nombre: string;
};

export type PolizaFormRefs = {
  clientes: FormCliente[];
  aseguradoras: FormAseguradora[];
  tiposSeguro: FormTipoSeguro[];
};

export type PolizaListItem = {
  id: number;
  numero: string;
  tipo: string;
  cobertura: CoberturaTipo;
  inicio: string;
  fin: string;
  suma: number;
  prima: number;
  estado: PolizaEstado;
  diasHastaVencimiento: number | null;
  cliente: PolizaClienteRef;
  aseguradora: PolizaAseguradoraRef;
};

export type PolizaFull = PolizaListItem & {
  emision: string;
  tipoSeguroId: number;
};

export type SiniestroDoc = {
  id: number;
  tipo: "img" | "pdf";
  nombre: string;
  url: string;
  tamano: string | null;
  procesadoIA: boolean;
};

export type SiniestroTab = "all" | "nuevo" | "tramite" | "cerrado";

export type SiniestrosFilters = {
  q?: string;
  tab?: SiniestroTab;
};

export type SiniestroCounts = Record<SiniestroTab, number>;

export type FormPolizaRef = {
  id: number;
  numero: string;
  clienteId: number;
  tipo: string;
  cobertura: CoberturaTipo;
};

export type SiniestroFormRefs = {
  clientes: FormCliente[];
  polizas: FormPolizaRef[];
};

export type SiniestroListItem = {
  id: number;
  numero: string;
  titulo: string;
  descripcion: string | null;
  cliente: PolizaClienteRef;
  fechaReporte: string;
  estado: SiniestroEstado;
  leido: boolean;
  docsCount: number;
};

export type SiniestroFull = SiniestroListItem & {
  fechaOcurrencia: string;
  aiSummary: string | null;
  docs: SiniestroDoc[];
  poliza: {
    id: number;
    numero: string;
    tipo: string;
    cobertura: CoberturaTipo;
    suma: number;
    aseguradora: PolizaAseguradoraRef;
  };
};

export type PagoEstado = "pendiente" | "validado" | "rechazado";

export type PagoListItem = {
  id: number;
  cliente: PolizaClienteRef;
  fechaPago: string | null;
  estado: PagoEstado;
  metodoPago: string | null;
  monto: number;
  polizasCount: number;
};

export type PagoPolizaRef = {
  id: number;
  numero: string;
  tipo: string;
  prima: number;
  aseguradora: PolizaAseguradoraRef;
};

export type PagoFull = PagoListItem & {
  comprobante: string | null;
  cbu: string | null;
  polizas: PagoPolizaRef[];
};

export type DashboardKPIs = {
  clientesActivos: number;
  polizasVigentes: number;
  siniestrosTramite: number;
  primaMensual: number;
};

export type SiniestroPendiente = {
  id: number;
  titulo: string;
  cliente: PolizaClienteRef;
  fechaReporte: string;
  docsCount: number;
  iaProcesada: boolean;
};

export type DistribucionAseguradora = {
  id: number;
  razonSocial: string;
  color: string;
  polizasActivas: number;
  pct: number;
};

export type SidebarBadges = {
  siniestrosNuevos: number;
  polizasPorVencer: number;
};
