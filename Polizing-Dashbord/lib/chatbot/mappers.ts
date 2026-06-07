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
  };
}

export type PolizaRow = {
  id: number;
  numero_poliza: string;
  dominio: string | null;
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
  const insuranceType = p.tipo_seguro?.nombre ?? "Tipo de seguro pendiente";
  const category = p.tipo_seguro?.categoria ?? "sin_categoria";
  const coverage = p.cobertura?.nombre ?? "Cobertura pendiente";

  return {
    id: p.id,
    policy_number: p.numero_poliza,
    insurance_type: insuranceType,
    category,
    coverage,
    domain: p.dominio ?? "",
    description: `${p.aseguradora.razon_social} - ${coverage}`,
  };
}
