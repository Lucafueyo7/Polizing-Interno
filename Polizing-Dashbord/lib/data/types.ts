import type { PolizaEstado, SiniestroEstado } from "@/lib/domain/poliza-status";

export type ClienteTipo = "corp" | "normal";
export type ClienteEstado = "activo" | "baja";

export type CategoriaSeguro =
  | "auto"
  | "vida"
  | "hogar"
  | "salud"
  | "comercio"
  | "art"
  | "agricola"
  | "otros";

export type MetodoPago =
  | "transferencia"
  | "debito_automatico"
  | "tarjeta_credito"
  | "tarjeta_debito"
  | "efectivo"
  | "mercadopago"
  | "cheque"
  | "otro";

/** Referencia liviana a una cobertura del catálogo. */
export type CoberturaRef = {
  id: number;
  nombre: string;
};

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
  codigoIntegracion: string | null;
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
  categoria: CategoriaSeguro;
};

/** Catálogo de coberturas válidas por tipo de seguro. */
export type CoberturaCatalogo = {
  tipoSeguroId: number;
  coberturas: CoberturaRef[];
};

export type PolizaFormRefs = {
  clientes: FormCliente[];
  aseguradoras: FormAseguradora[];
  tiposSeguro: FormTipoSeguro[];
  /** Catálogo de coberturas indexable por tipo_seguro_id. */
  coberturasPorTipo: CoberturaCatalogo[];
};

export type PolizaListItem = {
  id: number;
  numero: string;
  tipo: string;
  cobertura: CoberturaRef;
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
  tipoSeguroId: number;
  dominio: string | null;
};

export type SiniestroDoc = {
  id: number;
  tipo: "img" | "pdf";
  nombre: string;
  url: string;
  /** Signed URL que fuerza la descarga (Content-Disposition: attachment). */
  downloadUrl: string;
  tamano: string | null;
  procesadoIA: boolean;
};

export type SiniestroTab =
  | "all"
  | "nuevo"
  | "pendiente_documentacion"
  | "en_tramite"
  | "cerrado"
  | "rechazado";

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
  cobertura: CoberturaRef;
};

export type SiniestroFormRefs = {
  clientes: FormCliente[];
  polizas: FormPolizaRef[];
};

export type SiniestroListItem = {
  id: number;
  numero: string;
  titulo: string;
  cliente: PolizaClienteRef;
  fechaReporte: string;
  estado: SiniestroEstado;
  /** True si el usuario actual ya leyó el siniestro (resuelto vía `siniestro_lecturas`). */
  leidoPorMi: boolean;
  docsCount: number;
};

export type SiniestroFull = SiniestroListItem & {
  fechaOcurrencia: string;
  descripcion: string;
  docs: SiniestroDoc[];
  poliza: {
    id: number;
    numero: string;
    tipo: string;
    cobertura: CoberturaRef;
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
  metodoPago: MetodoPago | null;
  monto: number;
  polizasCount: number;
};

export type PagoPolizaRef = {
  id: number;
  numero: string;
  tipo: string;
  cobertura: CoberturaRef;
  concepto: string;
  prima: number;
  aseguradora: PolizaAseguradoraRef;
};

export type PagoFull = PagoListItem & {
  polizas: PagoPolizaRef[];
};

export type PagoTab = "all" | "pendiente" | "validado" | "rechazado";

export type PagosFilters = {
  tab?: PagoTab;
};

export type PagoCounts = Record<PagoTab, number>;

export type PagosSummary = {
  pendienteTotal: number;
  pendienteCount: number;
  validadoTotal: number;
  polizasAlcanzadas: number;
  /** Cantidad total de operaciones de pago registradas (alias histórico). */
  operaciones: number;
  empresas: number;
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
