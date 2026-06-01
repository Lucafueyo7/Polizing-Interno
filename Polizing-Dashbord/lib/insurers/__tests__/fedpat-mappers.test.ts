import { describe, it, expect } from "vitest";
import {
  carteraClienteToDto,
  reporteToDocument,
} from "../providers/federacion-patronal/mappers";

describe("reporteToDocument", () => {
  it("une los chunks base64 y arma un PDF", () => {
    const doc = reporteToDocument("poliza", {
      nombreReporte: "rep_poliza",
      desFormat: "PDF",
      reporte: ["AAA", "BBB"],
    });
    expect(doc).toEqual({
      tipo: "poliza",
      filename: "rep_poliza.pdf",
      mime_type: "application/pdf",
      content_base64: "AAABBB",
    });
  });

  it("usa el tipo como nombre por defecto si no viene nombreReporte", () => {
    const doc = reporteToDocument("certificado_cobertura", {
      desFormat: "PDF",
      reporte: [],
    });
    expect(doc.filename).toBe("certificado_cobertura.pdf");
    expect(doc.content_base64).toBe("");
  });
});

describe("carteraClienteToDto", () => {
  it("normaliza campos y preserva el crudo", () => {
    const dto = carteraClienteToDto({
      numero_documento: 12345678,
      nombre: "ACME SA",
      cuit: "30-12345678-9",
      email: "",
      telefono_p: "1130000000",
    });
    expect(dto.documento).toBe("12345678");
    expect(dto.nombre).toBe("ACME SA");
    expect(dto.cuit).toBe("30-12345678-9");
    expect(dto.email).toBeUndefined();
    expect(dto.telefono).toBe("1130000000");
    expect(dto.raw).toBeDefined();
  });
});
