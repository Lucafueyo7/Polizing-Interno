import { describe, it, expect } from "vitest";
import { mapClienteToChatbot, mapPolizaToChatbot } from "../mappers";

describe("mapClienteToChatbot", () => {
  it("persona: full_name = nombre + apellido", () => {
    const out = mapClienteToChatbot({
      id: 1,
      telefono: "5491112345678",
      tipo: "persona",
      clientes_corporativos: null,
      clientes_no_corporativos: { nombre: "Juan", apellido: "Pérez" },
    });
    expect(out.full_name).toBe("Juan Pérez");
    expect(out.phone).toBe("5491112345678");
    expect(out.active).toBe(true);
  });

  it("corporativo: full_name = razon_social", () => {
    const out = mapClienteToChatbot({
      id: 2,
      telefono: "5491100000000",
      tipo: "corporativo",
      clientes_corporativos: { razon_social: "ACME SA" },
      clientes_no_corporativos: null,
    });
    expect(out.full_name).toBe("ACME SA");
  });

  it("fallback si no hay subtabla", () => {
    const out = mapClienteToChatbot({
      id: 3,
      telefono: null,
      tipo: "persona",
      clientes_corporativos: null,
      clientes_no_corporativos: null,
    });
    expect(out.full_name).toBe("Cliente");
    expect(out.phone).toBe("");
  });
});

describe("mapPolizaToChatbot", () => {
  it("mapea todos los campos con joins", () => {
    const out = mapPolizaToChatbot({
      id: 7,
      numero_poliza: "AUTO-1001",
      dominio: "AB123CD",
      tipo_seguro: { nombre: "Automotor", categoria: "auto" },
      cobertura: { nombre: "todo_riesgo" },
      aseguradora: { razon_social: "La Caja" },
    });
    expect(out).toEqual({
      id: 7,
      policy_number: "AUTO-1001",
      insurance_type: "Automotor",
      category: "auto",
      coverage: "todo_riesgo",
      domain: "AB123CD",
      description: "La Caja — todo_riesgo",
    });
  });

  it("dominio null se mapea a string vacío", () => {
    const out = mapPolizaToChatbot({
      id: 8,
      numero_poliza: "HOG-2002",
      dominio: null,
      tipo_seguro: { nombre: "Hogar", categoria: "hogar" },
      cobertura: { nombre: "basica" },
      aseguradora: { razon_social: "Sancor" },
    });
    expect(out.domain).toBe("");
  });
});
