import { describe, it, expect } from "vitest";
import {
  decodeBase64File,
  FileDecodeError,
  MAX_FILE_BYTES,
} from "../files";

const b64 = (s: string) => Buffer.from(s).toString("base64");

describe("decodeBase64File", () => {
  it("decodifica PDF válido", () => {
    const out = decodeBase64File({
      filename: "x.pdf",
      mime_type: "application/pdf",
      content_base64: b64("hola"),
    });
    expect(out.bytes.toString()).toBe("hola");
    expect(out.size).toBe(4);
    expect(out.mime).toBe("application/pdf");
    expect(out.filename).toBe("x.pdf");
  });

  it("rechaza mime no permitido", () => {
    expect(() =>
      decodeBase64File({
        filename: "x.exe",
        mime_type: "application/x-msdownload",
        content_base64: b64("a"),
      }),
    ).toThrow(FileDecodeError);
  });

  it("rechaza base64 vacío", () => {
    expect(() =>
      decodeBase64File({
        filename: "x.pdf",
        mime_type: "application/pdf",
        content_base64: "",
      }),
    ).toThrow(/vacío|inválido/);
  });

  it("rechaza archivo > MAX_FILE_BYTES con status 413", () => {
    const big = Buffer.alloc(MAX_FILE_BYTES + 1).toString("base64");
    try {
      decodeBase64File({
        filename: "big.pdf",
        mime_type: "application/pdf",
        content_base64: big,
      });
      throw new Error("debería haber lanzado");
    } catch (e) {
      expect(e).toBeInstanceOf(FileDecodeError);
      expect((e as FileDecodeError).status).toBe(413);
    }
  });
});
