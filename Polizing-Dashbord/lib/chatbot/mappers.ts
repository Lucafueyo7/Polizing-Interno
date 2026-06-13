export type ClienteRow = {
  id: number;
  telefono: string | null;
  tipo: "corporativo" | "persona";
  clientes_corporativos: { razon_social: string } | null;
  clientes_no_corporativos: { nombre: string; apellido: string } | null;
};

export type ClienteChatbotShape = {
  id: number;
  phone: string;
  full_name: string;
  active: true;
  // Adjuntar comprobantes de pago es exclusivo de clientes corporativos.
  is_corporate: boolean;
};

export function mapClienteToChatbot(c: ClienteRow): ClienteChatbotShape {
  const full_name =
    c.tipo === "corporativo"
      ? c.clientes_corporativos?.razon_social ?? "Cliente"
      : `${c.clientes_no_corporativos?.nombre ?? ""} ${c.clientes_no_corporativos?.apellido ?? ""}`.trim() ||
        "Cliente";
  return {
    id: c.id,
    phone: c.telefono ?? "",
    full_name,
    active: true,
    is_corporate: c.tipo === "corporativo",
  };
}

export type PolizaRow = {
  id: number;
  numero_poliza: string;
  dominio: string | null;
  // Pueden venir en null en pólizas importadas de Berkley aún sin completar.
  tipo_seguro: { nombre: string; categoria: string } | null;
  cobertura: { nombre: string } | null;
  aseguradora: { razon_social: string };
};

export type PolicyChatbotShape = {
  id: number;
  policy_number: string;
  insurance_type: string;
  category: string;
  coverage: string;
  domain: string;
  description: string;
};

export function mapPolizaToChatbot(p: PolizaRow): PolicyChatbotShape {
  const cobertura = p.cobertura?.nombre ?? "";
  return {
    id: p.id,
    policy_number: p.numero_poliza,
    insurance_type: p.tipo_seguro?.nombre ?? "",
    category: p.tipo_seguro?.categoria ?? "",
    coverage: cobertura,
    domain: p.dominio ?? "",
    description: `${p.aseguradora.razon_social} — ${cobertura || p.tipo_seguro?.nombre || "Póliza"}`,
  };
}
