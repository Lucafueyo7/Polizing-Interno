import { describe, it, expect } from "vitest";
import {
  paymentReceiptBodySchema,
  claimBodySchema,
  circulationCardBodySchema,
  policyRequestBodySchema,
  phoneSchema,
} from "../schemas";

const b64 = (s: string) => Buffer.from(s).toString("base64");
const validFile = {
  filename: "x.pdf",
  mime_type: "application/pdf",
  content_base64: b64("hola"),
};
const validPolicy = { id: 7 };

describe("phoneSchema", () => {
  it("acepta dígitos válidos", () => {
    expect(phoneSchema.safeParse("5491112345678").success).toBe(true);
  });
  it("rechaza letras", () => {
    expect(phoneSchema.safeParse("abc").success).toBe(false);
  });
  it("rechaza largo fuera de rango", () => {
    expect(phoneSchema.safeParse("123").success).toBe(false);
    expect(phoneSchema.safeParse("1".repeat(20)).success).toBe(false);
  });
});

describe("circulationCardBodySchema", () => {
  it("happy", () => {
    const r = circulationCardBodySchema.safeParse({ phone: "5491112345678", policy_id: 7 });
    expect(r.success).toBe(true);
  });
  it("rechaza policy_id no entero", () => {
    const r = circulationCardBodySchema.safeParse({ phone: "5491112345678", policy_id: 1.5 });
    expect(r.success).toBe(false);
  });
});

describe("paymentReceiptBodySchema", () => {
  it("happy con varias pólizas y archivos", () => {
    const r = paymentReceiptBodySchema.safeParse({
      phone: "5491112345678",
      policies: [validPolicy, { ...validPolicy, id: 99 }],
      files: [validFile, validFile],
    });
    expect(r.success).toBe(true);
  });
  it("rechaza base64 inválido", () => {
    const r = paymentReceiptBodySchema.safeParse({
      phone: "5491112345678",
      policies: [validPolicy],
      files: [{ ...validFile, content_base64: "no es base64 ?!" }],
    });
    expect(r.success).toBe(false);
  });
  it("rechaza sin pólizas o sin archivos", () => {
    expect(
      paymentReceiptBodySchema.safeParse({
        phone: "5491112345678",
        policies: [],
        files: [validFile],
      }).success,
    ).toBe(false);
    expect(
      paymentReceiptBodySchema.safeParse({
        phone: "5491112345678",
        policies: [validPolicy],
        files: [],
      }).success,
    ).toBe(false);
  });
});

describe("claimBodySchema", () => {
  const base = {
    phone: "5491112345678",
    policy: validPolicy,
    date: "10/05/2026",
    time: "14:30",
    place: "Av Corrientes",
    description: "Choque trasero",
    third_parties: "NO",
    driver_license: validFile,
    vehicle_card: validFile,
    police_report: null as any,
    additional_files: [],
  };

  it("happy", () => {
    expect(claimBodySchema.safeParse(base).success).toBe(true);
  });
  it("rechaza date mal formateada", () => {
    expect(claimBodySchema.safeParse({ ...base, date: "2026-05-10" }).success).toBe(false);
  });
  it("rechaza time mal formateada", () => {
    expect(claimBodySchema.safeParse({ ...base, time: "14:30:00" }).success).toBe(false);
  });
  it("acepta police_report null", () => {
    expect(claimBodySchema.safeParse({ ...base, police_report: null }).success).toBe(true);
  });
  it("acepta additional_files con varios archivos", () => {
    expect(
      claimBodySchema.safeParse({ ...base, additional_files: [validFile, validFile] }).success,
    ).toBe(true);
  });
});

describe("policyRequestBodySchema", () => {
  const base = {
    phone: "5491112345678",
    insurance_type: "auto",
    domain: "AB123CD",
    brand: "Renault",
    model: "Sandero",
    year: "2020",
    use: "particular",
    notes: "",
  };

  it("happy", () => {
    expect(policyRequestBodySchema.safeParse(base).success).toBe(true);
  });
  it("rechaza year no 4 dígitos", () => {
    expect(policyRequestBodySchema.safeParse({ ...base, year: "20" }).success).toBe(false);
  });
  it("rechaza use fuera del enum", () => {
    expect(policyRequestBodySchema.safeParse({ ...base, use: "otra" }).success).toBe(false);
  });
  it("rechaza insurance_type fuera del enum", () => {
    expect(policyRequestBodySchema.safeParse({ ...base, insurance_type: "vida" }).success).toBe(false);
  });
});
