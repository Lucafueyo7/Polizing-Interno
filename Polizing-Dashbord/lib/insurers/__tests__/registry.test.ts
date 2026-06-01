import { describe, it, expect } from "vitest";
import {
  getProvider,
  getProviderWithCapability,
} from "../registry";
import { InsurerError, NotSupportedError } from "../errors";

describe("registry", () => {
  it("resuelve Berkley y declara sus capacidades", () => {
    const p = getProvider("berkley");
    expect(p.slug).toBe("berkley");
    expect(p.supports("documents")).toBe(true);
    expect(p.supports("cartera")).toBe(true);
    expect(p.supports("novedades")).toBe(true);
  });

  it("Federación Patronal soporta documents/cartera pero NO novedades", () => {
    const p = getProvider("federacion_patronal");
    expect(p.supports("documents")).toBe(true);
    expect(p.supports("cartera")).toBe(true);
    expect(p.supports("novedades")).toBe(false);
  });

  it("getProviderWithCapability lanza NotSupportedError si no soporta la capacidad", () => {
    expect(() =>
      getProviderWithCapability("federacion_patronal", "novedades"),
    ).toThrow(NotSupportedError);
  });

  it("lanza InsurerError para un slug desconocido", () => {
    expect(() => getProvider("la_caja")).toThrow(InsurerError);
  });
});
