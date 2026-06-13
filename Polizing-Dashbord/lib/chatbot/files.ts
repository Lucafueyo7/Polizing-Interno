export const MAX_FILE_BYTES = 8 * 1024 * 1024;
export const MAX_TOTAL_BYTES = 25 * 1024 * 1024;

// Aceptamos PDF y CUALQUIER tipo de imagen (jpeg, png, webp, heic, gif, …),
// alineado con `valid_media` del bot. Los clientes mandan comprobantes en
// formatos variados, sobre todo desde el celular.
export function isAllowedMime(mime: string): boolean {
  return mime === "application/pdf" || mime.startsWith("image/");
}

export type RawMediaFile = {
  filename: string;
  mime_type: string;
  content_base64: string;
};

export type DecodedFile = {
  bytes: Buffer;
  size: number;
  mime: string;
  filename: string;
};

export class FileDecodeError extends Error {
  constructor(message: string, public status: 422 | 413 = 422) {
    super(message);
    this.name = "FileDecodeError";
  }
}

export function decodeBase64File(file: RawMediaFile): DecodedFile {
  if (!isAllowedMime(file.mime_type)) {
    throw new FileDecodeError(`MIME no permitido: ${file.mime_type}`);
  }
  let bytes: Buffer;
  try {
    bytes = Buffer.from(file.content_base64, "base64");
  } catch {
    throw new FileDecodeError("content_base64 inválido");
  }
  if (bytes.length === 0) throw new FileDecodeError("content_base64 vacío");
  if (bytes.length > MAX_FILE_BYTES) {
    throw new FileDecodeError(
      `Archivo excede límite de ${MAX_FILE_BYTES / 1024 / 1024} MB`,
      413,
    );
  }
  return {
    bytes,
    size: bytes.length,
    mime: file.mime_type,
    filename: file.filename,
  };
}
