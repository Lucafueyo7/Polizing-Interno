import { describe, it, expect } from "vitest";
import {
  parseFechaAAAAMMDD,
  parseFechaDDMMAAAA,
  parseFixedWidth,
  parseFixedWidthLine,
  type FixedLayout,
} from "../fixed-width";

const LAYOUT: FixedLayout = [
  { name: "rama", desde: 1, longitud: 2 },
  { name: "poliza", desde: 3, longitud: 7 },
  { name: "nombre", desde: 10, longitud: 10 },
];

describe("parseFixedWidthLine", () => {
  it("extrae campos por posición (base 1) y aplica trim", () => {
    // "01" + "1234567" + "JUAN      "
    const line = "011234567JUAN      ";
    expect(parseFixedWidthLine(line, LAYOUT)).toEqual({
      rama: "01",
      poliza: "1234567",
      nombre: "JUAN",
    });
  });
});

describe("parseFixedWidth", () => {
  it("parsea múltiples líneas ignorando vacías", () => {
    const text = "011234567JUAN      \n029999999ANA       \n\n";
    const rows = parseFixedWidth(text, LAYOUT);
    expect(rows).toHaveLength(2);
    expect(rows[1]).toEqual({ rama: "02", poliza: "9999999", nombre: "ANA" });
  });

  it("decodifica buffers latin1 (acentos windows-1252)", () => {
    // 0xD1 = Ñ en latin1; en UTF-8 se corrompería.
    const buf = Buffer.from([
      0x30, 0x31, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0xd1, 0x20, 0x20,
      0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20,
    ]);
    const [row] = parseFixedWidth(buf, LAYOUT);
    expect(row.nombre).toBe("Ñ");
  });
});

describe("parseo de fechas", () => {
  it("AAAAMMDD", () => {
    expect(parseFechaAAAAMMDD("20260315")?.toISOString()).toBe(
      "2026-03-15T00:00:00.000Z",
    );
    expect(parseFechaAAAAMMDD("00000000")).toBeNull();
    expect(parseFechaAAAAMMDD("2026")).toBeNull();
  });

  it("DDMMAAAA (ej. RieCer)", () => {
    expect(parseFechaDDMMAAAA("15032026")?.toISOString()).toBe(
      "2026-03-15T00:00:00.000Z",
    );
  });
});
