import { describe, it, expect } from "vitest";
import { normalizeTelefono, formatTelefono } from "../telefono";

describe("normalizeTelefono", () => {
  it("strip separadores y prefijo +", () => {
    expect(normalizeTelefono("+54 11 5634-7821")).toBe("541156347821");
    expect(normalizeTelefono("(011) 4892-1003")).toBe("01148921003");
    expect(normalizeTelefono("+1 (415) 555-2671")).toBe("14155552671");
  });
  it("null/undefined/vacío → null", () => {
    expect(normalizeTelefono(null)).toBeNull();
    expect(normalizeTelefono(undefined)).toBeNull();
    expect(normalizeTelefono("")).toBeNull();
    expect(normalizeTelefono("   ")).toBeNull();
    expect(normalizeTelefono("---")).toBeNull();
  });
  it("ya normalizado se mantiene", () => {
    expect(normalizeTelefono("5491156347821")).toBe("5491156347821");
  });
});

describe("formatTelefono", () => {
  it("AR móvil (549 + área 2 + 8 dígitos)", () => {
    expect(formatTelefono("5491156347821")).toBe("+54 9 11 5634-7821");
  });
  it("AR móvil con área 3 dígitos (interior)", () => {
    expect(formatTelefono("5492614239018")).toBe("+54 9 261 423-9018");
  });
  it("AR fijo Buenos Aires (54 11 + 8 dígitos)", () => {
    expect(formatTelefono("541148921003")).toBe("+54 11 4892-1003");
  });
  it("AR fijo interior", () => {
    expect(formatTelefono("542614239018")).toBe("+54 261 423-9018");
  });
  it("null/vacío → guión", () => {
    expect(formatTelefono(null)).toBe("—");
    expect(formatTelefono(undefined)).toBe("—");
    expect(formatTelefono("")).toBe("—");
  });
  it("formato genérico para prefijos no-AR", () => {
    expect(formatTelefono("14155552671")).toBe("+14 1555 5267 1");
    expect(formatTelefono("4915123456789")).toBe("+491 5123 4567 89");
  });
  it("tolera input ya formateado (re-normaliza)", () => {
    expect(formatTelefono("+54 11 4892-1003")).toBe("+54 11 4892-1003");
  });
});
